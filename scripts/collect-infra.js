// 通过 docker.sock 采集宿主机全部容器配置，供反向生成 compose 使用。
// 在 Gitea Actions 的 job 容器内运行：/var/run/docker.sock 由 runner 自动挂入。
const http = require('http');
const fs = require('fs');

const SOCK = '/var/run/docker.sock';
const API = '/v1.43';
const OUT = '/deploy/_infra.json';

function api(path) {
  return new Promise((resolve, reject) => {
    const req = http.request({ socketPath: SOCK, path: API + path, method: 'GET' }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        if (res.statusCode !== 200) {
          return reject(new Error(`${path} -> ${res.statusCode} ${body.slice(0, 160)}`));
        }
        try { resolve(JSON.parse(body)); } catch (e) { reject(new Error(path + ' json: ' + e.message)); }
      });
    });
    req.on('error', reject);
    req.setTimeout(20000, () => req.destroy(new Error('timeout ' + path)));
    req.end();
  });
}

function pickInspect(info) {
  const c = info.Config || {};
  const h = info.HostConfig || {};
  return {
    Config: {
      Image: c.Image,
      Cmd: c.Cmd,
      Entrypoint: c.Entrypoint,
      Env: c.Env,
      Labels: c.Labels,
      ExposedPorts: c.ExposedPorts,
      WorkingDir: c.WorkingDir,
      User: c.User,
      Hostname: c.Hostname,
      Tty: c.Tty,
      OpenStdin: c.OpenStdin,
      StopSignal: c.StopSignal,
      Healthcheck: c.Healthcheck,
    },
    HostConfig: {
      Binds: h.Binds,
      PortBindings: h.PortBindings,
      RestartPolicy: h.RestartPolicy,
      NetworkMode: h.NetworkMode,
      Privileged: h.Privileged,
      CapAdd: h.CapAdd,
      Devices: h.Devices,
      Ulimits: h.Ulimits,
      LogConfig: h.LogConfig,
      ExtraHosts: h.ExtraHosts,
      Dns: h.Dns,
      Tmpfs: h.Tmpfs,
      Sysctls: h.Sysctls,
      ShmSize: h.ShmSize,
      Memory: h.Memory,
      NanoCpus: h.NanoCpus,
      CpuShares: h.CpuShares,
      SecurityOpt: h.SecurityOpt,
      ReadonlyRootfs: h.ReadonlyRootfs,
      PidMode: h.PidMode,
      IpcMode: h.IpcMode,
      GroupAdd: h.GroupAdd,
    },
    Mounts: (info.Mounts || []).map((m) => ({
      Type: m.Type, Source: m.Source, Destination: m.Destination, Mode: m.Mode, RW: m.RW,
    })),
    Networks: Object.fromEntries(
      Object.entries((info.NetworkSettings || {}).Networks || {}).map(([k, v]) => [k, {
        IPAddress: v.IPAddress, Aliases: v.Aliases, NetworkID: v.NetworkID, Links: v.Links,
      }])
    ),
  };
}

(async () => {
  const list = await api('/containers/json?all=1');
  const targets = list.filter((c) => !(c.Names[0] || '').startsWith('/GITEA-ACTIONS-'));
  console.log(`容器总数 ${list.length}，排除 job 容器后 ${targets.length}`);

  const containers = [];
  for (const c of targets) {
    const name = (c.Names[0] || '').replace(/^\//, '');
    const labels = c.Labels || {};
    try {
      const info = await api(`/containers/${c.Id}/json`);
      containers.push({
        name,
        id: c.Id.slice(0, 12),
        image: c.Image,
        state: c.State,
        status: c.Status,
        created: c.Created,
        project: labels['com.docker.compose.project'] || null,
        service: labels['com.docker.compose.service'] || null,
        configFiles: labels['com.docker.compose.project.config_files'] || null,
        workingDir: labels['com.docker.compose.project.working_dir'] || null,
        inspect: pickInspect(info),
      });
    } catch (e) {
      console.log(`  跳过 ${name}: ${e.message}`);
    }
  }

  const [engine, volumes, networks, images] = await Promise.all([
    api('/version'), api('/volumes'), api('/networks'), api('/images/json'),
  ]);

  const result = {
    collectedAt: new Date().toISOString(),
    engine: { Version: engine.Version, ApiVersion: engine.ApiVersion, Os: engine.Os, Arch: engine.Arch },
    containers,
    volumes: (volumes.Volumes || []).map((v) => ({ Name: v.Name, Driver: v.Driver, Mountpoint: v.Mountpoint })),
    networks: networks.map((n) => ({ Name: n.Name, Driver: n.Driver, Id: n.Id.slice(0, 12), Labels: n.Labels })),
    images: images.map((i) => ({ tags: i.RepoTags, sizeMB: Math.round(i.Size / 1048576) })),
  };

  fs.writeFileSync(OUT, JSON.stringify(result, null, 2));
  const st = fs.statSync(OUT);

  const byState = {};
  for (const c of containers) byState[c.state] = (byState[c.state] || 0) + 1;
  const projects = [...new Set(containers.map((c) => c.project).filter(Boolean))];

  console.log(`已写入 ${OUT}，${(st.size / 1024).toFixed(1)} KB`);
  console.log('状态分布:', JSON.stringify(byState));
  console.log('compose 项目:', projects.join(', ') || '(无)');
  console.log('named volumes:', result.volumes.length, '| networks:', result.networks.length, '| images:', result.images.length);
})().catch((e) => { console.error('采集失败:', e.message); process.exit(1); });
