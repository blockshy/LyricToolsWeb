# LyricToolsWeb 本地测试与静态发布

## 脚本职责

| 脚本 | 用途 |
| --- | --- |
| `start-local-test.sh` | 启动本地 Vite 服务，按 `Ctrl-C` 停止 |
| `build-artifact.sh` | 执行生产依赖审计与 build，生成归档 |
| `upload-artifact.sh` | 暂存并验证归档，不切换站点 |
| `deploy-remote.sh` | 原子切换、更新 sitemap 并 smoke |

## 本地开发示例

```bash
cd /huyu/workspace/WebSite/LyricToolsWeb
./deploy/start-local-test.sh
```

默认会先执行 `npm ci`；快速重启及自定义端口示例：

```bash
./deploy/start-local-test.sh --skip-install -- --host 127.0.0.1 --port 4174
```

## Dev 发布完整示例

```bash
cd /huyu/workspace/WebSite/LyricToolsWeb
commit="$(git rev-parse HEAD)"

./deploy/build-artifact.sh
release_manifest="/huyu/artifacts/remote-deploy/static/lyric-tools/${commit}/release.json"

./deploy/upload-artifact.sh "$release_manifest" dev
./deploy/deploy-remote.sh "$release_manifest" dev "$commit"
```

当前仓库没有 lint/test npm script，因此发布门禁是 clean/upstream、`npm ci`、生产依赖
审计和 `npm run build`。Prod 将两处 `dev` 改为 `prod`。SSH 使用现有 agent/配置；脚本
不读取项目秘密，也不把秘密写入 manifest。公共控制面可由
`TYUKKI_DEPLOY_CONTROL_ROOT` 覆盖。
