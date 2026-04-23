# OpenScreen 代码改进规划文档

> 版本: 1.0  
> 创建日期: 2026-04-22  
> 策略: 安全渐进式改进

---

## 目录

1. [改进概述](#改进概述)
2. [风险评估矩阵](#风险评估矩阵)
3. [阶段规划](#阶段规划)
4. [测试策略](#测试策略)
5. [回滚方案](#回滚方案)
6. [用户配合清单](#用户配合清单)

---

## 改进概述

### 目标

在不破坏现有功能的前提下，逐步提升代码质量和可维护性。

### 核心原则

1. **小步快跑** - 每次只改一小部分
2. **测试先行** - 修改前确保有测试覆盖
3. **可回滚** - 每个阶段都可以独立回滚
4. **验证通过再下一步** - 不跳过测试环节

---

## 风险评估矩阵

| 风险等级 | 定义 | 应对策略 |
|---------|------|---------|
| 🟢 低风险 | 纯添加操作，不影响现有代码 | 可直接执行 |
| 🟡 中风险 | 修改现有代码，但逻辑简单 | 需要测试验证 |
| 🔴 高风险 | 重构核心逻辑，影响面广 | 需要完整回归测试 |

---

## 阶段规划

### 阶段 0: 基线建立 (1-2 天) 🟢

**目标**: 建立测试基线，确保后续改进可验证

#### 任务清单

- [ ] 运行现有测试，记录通过率
- [ ] 创建手动测试清单
- [ ] 建立 Git 分支策略
- [ ] 记录当前功能基线

#### 具体工作

```bash
# 1. 创建改进分支
git checkout -b refactoring/phase-0-baseline

# 2. 运行现有测试
npm test

# 3. 构建验证
npm run build
```

#### 交付物

- [ ] `TEST_BASELINE.md` - 测试结果记录
- [ ] `MANUAL_TEST_CHECKLIST.md` - 手动测试清单
- [ ] 功能正常的构建版本

---

### 阶段 1: 类型安全增强 (2-3 天) 🟢

**目标**: 提升 TypeScript 类型安全性，零运行时影响

#### 任务清单

- [ ] 创建 IPC 类型定义文件
- [ ] 补充缺失的类型定义
- [ ] 启用更严格的 TypeScript 规则
- [ ] 修复类型错误

#### 文件变更

```
electron/
  └── types/
      └── ipc.ts              # 新增: IPC 类型定义
src/
  └── types/
      └── electron-api.ts     # 新增: API 类型定义
```

#### 代码示例

```typescript
// electron/types/ipc.ts
export interface IpcChannels {
  'get-sources': {
    request: Electron.SourcesOptions;
    response: ProcessedDesktopSource[];
  };
  'save-project-file': {
    request: [unknown, string?, string?];
    response: SaveProjectResult;
  };
  // ... 其他通道
}
```

#### 测试要求

- [ ] TypeScript 编译通过 (`npm run build`)
- [ ] 无类型错误
- [ ] 现有功能正常

---

### 阶段 2: 常量提取 (1-2 天) 🟢

**目标**: 消除魔法数字，提高代码可读性

#### 任务清单

- [ ] 提取 VideoEditor 中的常量
- [ ] 提取 handlers.ts 中的常量
- [ ] 提取导出相关常量
- [ ] 统一命名规范

#### 文件变更

```
src/
  └── constants/
      ├── editor.ts           # 新增: 编辑器常量
      ├── export.ts           # 新增: 导出常量
      └── video.ts            # 新增: 视频处理常量
```

#### 提取内容示例

```typescript
// src/constants/export.ts
export const EXPORT_CONSTANTS = {
  BITRATE: {
    DEFAULT: 30_000_000,
    QHD: 50_000_000,
    UHD: 80_000_000,
    HD: 20_000_000,
    SD: 10_000_000,
  },
  QUALITY: {
    TARGET_HEIGHT: {
      MEDIUM: 720,
      GOOD: 1080,
    },
  },
  GIF: {
    DEFAULT_FRAME_RATE: 15,
    MAX_DIMENSION: 480,
  },
} as const;
```

#### 测试要求

- [ ] 所有常量引用正确
- [ ] 导出功能正常
- [ ] 视频质量设置正常

---

### 阶段 3: 工具函数拆分 (2-3 天) 🟡

**目标**: 从 VideoEditor 提取纯工具函数

#### 任务清单

- [ ] 提取项目持久化逻辑
- [ ] 提取导出相关逻辑
- [ ] 提取快捷键处理逻辑
- [ ] 保持现有 API 不变

#### 文件变更

```
src/
  └── components/
      └── video-editor/
          └── hooks/
              ├── useProjectPersistence.ts    # 新增
              ├── useExport.ts                # 新增
              └── useKeyboardShortcuts.ts     # 新增
```

#### 拆分策略

```typescript
// hooks/useProjectPersistence.ts
export function useProjectPersistence() {
  const [currentProjectPath, setCurrentProjectPath] = useState<string | null>(null);
  
  const saveProject = useCallback(async (forceSaveAs: boolean) => {
    // 从 VideoEditor 移出的逻辑
  }, []);
  
  const loadProject = useCallback(async () => {
    // 从 VideoEditor 移出的逻辑
  }, []);
  
  return {
    currentProjectPath,
    saveProject,
    loadProject,
    // ...
  };
}
```

#### 测试要求

- [ ] 项目保存/加载功能正常
- [ ] 快捷键功能正常
- [ ] 导出功能正常
- [ ] 撤销/重做不受影响

---

### 阶段 4: 安全加固 (1-2 天) 🟡

**目标**: 修复安全风险，启用安全策略

#### 任务清单

- [ ] 条件启用 webSecurity
- [ ] 添加 CSP 配置
- [ ] 验证资源加载
- [ ] 测试所有功能

#### 文件变更

```
electron/
  └── windows.ts            # 修改: 安全策略
electron/
  └── security/
      └── csp.ts            # 新增: CSP 配置
```

#### 关键修改

```typescript
// electron/windows.ts
const isDev = !!VITE_DEV_SERVER_URL;

webPreferences: {
  webSecurity: !isDev,  // 开发环境禁用，生产环境启用
  // ...
}
```

#### 测试要求

- [ ] 开发环境功能正常
- [ ] 生产构建功能正常
- [ ] 资源加载无错误
- [ ] 无安全警告

---

### 阶段 5: 组件拆分 (3-5 天) 🔴

**目标**: 拆分 VideoEditor 组件

#### 任务清单

- [ ] 拆分 EditorToolbar 组件
- [ ] 拆分 VideoPreview 组件
- [ ] 拆分 TimelineContainer 组件
- [ ] 拆分 SettingsPanel 容器

#### 文件变更

```
src/
  └── components/
      └── video-editor/
          ├── VideoEditor.tsx              # 大幅简化
          ├── EditorToolbar.tsx            # 新增
          ├── VideoPreview.tsx             # 新增
          ├── TimelineContainer.tsx        # 新增
          └── index.ts                     # 新增: 统一导出
```

#### 拆分后结构

```typescript
// VideoEditor.tsx 简化后
export default function VideoEditor() {
  const { state, undo, redo } = useEditorHistory();
  const project = useProjectPersistence();
  const export = useExport();
  
  return (
    <div className="flex flex-col h-screen">
      <EditorToolbar 
        onSave={project.saveProject}
        onLoad={project.loadProject}
        // ...
      />
      <VideoPreview 
        videoPath={project.videoPath}
        zoomRegions={state.zoomRegions}
        // ...
      />
      <TimelineContainer 
        regions={state}
        onUndo={undo}
        onRedo={redo}
        // ...
      />
      <SettingsPanel 
        settings={state}
        onExport={export.handleExport}
        // ...
      />
    </div>
  );
}
```

#### 测试要求

- [ ] 完整的手动测试清单全部通过
- [ ] 所有快捷键正常
- [ ] 所有编辑功能正常
- [ ] 导出功能正常
- [ ] 项目保存/加载正常
- [ ] 撤销/重做正常

---

### 阶段 6: 性能优化 (2-3 天) 🟡

**目标**: 优化渲染性能

#### 任务清单

- [ ] 添加 React.memo
- [ ] 优化 useCallback 依赖
- [ ] 添加 useMemo 缓存
- [ ] 性能测试对比

#### 测试要求

- [ ] 无明显性能退化
- [ ] 大文件处理正常
- [ ] 内存使用正常

---

## 测试策略

### 自动化测试

```bash
# 每次修改后运行
npm run lint          # 代码规范检查
npm run typecheck     # TypeScript 检查
npm test              # 单元测试
npm run build         # 构建验证
```

### 手动测试清单

#### 核心功能测试

- [ ] 应用启动正常
- [ ] 屏幕录制正常
- [ ] 摄像头录制正常
- [ ] 视频播放正常
- [ ] 时间轴操作正常

#### 编辑功能测试

- [ ] 添加/删除 Zoom 区域
- [ ] 添加/删除 Trim 区域
- [ ] 添加/删除 Speed 区域
- [ ] 添加/编辑/删除 Annotation
- [ ] 撤销/重做功能

#### 导出功能测试

- [ ] MP4 导出（不同质量）
- [ ] GIF 导出
- [ ] 导出取消功能
- [ ] 导出进度显示

#### 项目功能测试

- [ ] 保存项目
- [ ] 加载项目
- [ ] 另存为项目
- [ ] 未保存提示

#### 快捷键测试

- [ ] Space - 播放/暂停
- [ ] Ctrl+Z - 撤销
- [ ] Ctrl+Y / Ctrl+Shift+Z - 重做
- [ ] 左右箭头 - 逐帧导航

---

## 回滚方案

### 每个阶段的回滚

```bash
# 如果发现问题，回滚到上一阶段
git checkout main
git branch -D refactoring/phase-X-feature

# 或者使用 git revert
git revert HEAD~n..HEAD
```

### 紧急回滚

```bash
# 保存当前工作
git stash

# 回到稳定版本
git checkout main

# 重新安装依赖
npm ci

# 验证构建
npm run build
```

---

## 用户配合清单

### 每个阶段开始前

- [ ] 确认当前工作已保存
- [ ] 确认 Git 工作区干净
- [ ] 备份重要数据

### 每个阶段完成后

- [ ] 运行完整的手动测试清单
- [ ] 验证核心功能正常
- [ ] 确认无控制台错误
- [ ] 批准进入下一阶段

### 测试环境要求

```bash
# 确保以下环境可用
node --version  # v22.22.1
npm --version   # 10.9.4

# 安装依赖
npm ci

# 开发环境
npm run dev

# 生产构建测试
npm run build
```

### 反馈模板

```markdown
## 阶段 X 测试结果

### 环境
- OS: Windows/macOS/Linux
- Node: v22.22.1
- 分支: refactoring/phase-X-feature

### 测试结果
- [ ] 自动化测试通过
- [ ] 手动测试通过
- [ ] 构建成功

### 发现的问题
1. ...
2. ...

### 是否批准进入下一阶段
- [ ] 是
- [ ] 否，需要修复上述问题
```

---

## 时间规划

| 阶段 | 预计时间 | 风险等级 | 依赖 |
|-----|---------|---------|-----|
| 0 - 基线建立 | 1-2 天 | 🟢 低 | 无 |
| 1 - 类型安全 | 2-3 天 | 🟢 低 | 阶段 0 |
| 2 - 常量提取 | 1-2 天 | 🟢 低 | 阶段 1 |
| 3 - 工具拆分 | 2-3 天 | 🟡 中 | 阶段 2 |
| 4 - 安全加固 | 1-2 天 | 🟡 中 | 阶段 3 |
| 5 - 组件拆分 | 3-5 天 | 🔴 高 | 阶段 4 |
| 6 - 性能优化 | 2-3 天 | 🟡 中 | 阶段 5 |

**总计**: 12-20 天（可根据优先级选择阶段）

---

## 附录

### A. Git 工作流

```bash
# 1. 从 main 创建阶段分支
git checkout -b refactoring/phase-1-types

# 2. 完成阶段后合并回 main
git checkout main
git merge --no-ff refactoring/phase-1-types

# 3. 打标签标记阶段完成
git tag -a v1.1-phase-1 -m "阶段 1 完成: 类型安全增强"
```

### B. 代码审查清单

- [ ] TypeScript 编译无错误
- [ ] 无 console.log 遗留
- [ ] 无 debugger 语句
- [ ] 代码格式化正确
- [ ] 新增代码有注释
- [ ] 导出功能正常

### C. 文档更新

每个阶段完成后更新：
- [ ] 本规划文档的进度
- [ ] README.md（如需要）
- [ ] CHANGELOG.md

---

*文档结束*
