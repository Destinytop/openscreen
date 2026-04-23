/**
 * 项目持久化 Hook
 *
 * 管理项目的保存、加载和自动保存功能
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { ProjectMedia, RecordingSession } from "@/lib/recordingSession";

export interface ProjectState {
	projectPath: string | null;
	videoPath: string | null;
	webcamVideoPath: string | null;
	projectMedia: ProjectMedia[];
	recordingSession: RecordingSession | null;
}

export interface UseProjectPersistenceOptions {
	onProjectSaved?: (path: string) => void;
	onProjectLoaded?: (state: Partial<ProjectState>) => void;
	onError?: (error: string) => void;
}

export interface UseProjectPersistenceReturn {
	/** 当前项目路径 */
	currentProjectPath: string | null;
	/** 是否有未保存的更改 */
	hasUnsavedChanges: boolean;
	/** 保存项目 */
	saveProject: (forceSaveAs?: boolean) => Promise<boolean>;
	/** 加载项目 */
	loadProject: () => Promise<boolean>;
	/** 标记有未保存的更改 */
	markUnsavedChanges: () => void;
	/** 清除未保存更改标记 */
	clearUnsavedChanges: () => void;
}

/** 自动保存间隔（毫秒） */
const AUTO_SAVE_INTERVAL = 30000;

/** 自动保存防抖延迟（毫秒） */
const AUTO_SAVE_DEBOUNCE = 2000;

export function useProjectPersistence(
	projectState: ProjectState,
	options: UseProjectPersistenceOptions = {},
): UseProjectPersistenceReturn {
	const { onProjectSaved, onProjectLoaded, onError } = options;

	const [currentProjectPath, setCurrentProjectPath] = useState<string | null>(null);
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

	const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const lastAutoSaveRef = useRef<number>(0);

	// 保存项目核心逻辑
	const saveProjectCore = useCallback(
		async (forceSaveAs: boolean): Promise<boolean> => {
			try {
				const suggestedName = projectState.videoPath
					? `${projectState.videoPath.split("/").pop()?.split(".")[0] ?? "project"}.openscreen`
					: "project.openscreen";

				const result = await window.electronAPI.saveProjectFile(
					{
						videoPath: projectState.videoPath,
						webcamVideoPath: projectState.webcamVideoPath,
						projectMedia: projectState.projectMedia,
						recordingSession: projectState.recordingSession,
					},
					suggestedName,
					forceSaveAs ? undefined : (currentProjectPath ?? undefined),
				);

				if (result.canceled) {
					return false;
				}

				if (!result.success) {
					throw new Error(result.error || "Failed to save project");
				}

				if (result.path) {
					setCurrentProjectPath(result.path);
					onProjectSaved?.(result.path);
				}

				setHasUnsavedChanges(false);
				return true;
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : "Unknown error";
				onError?.(errorMessage);
				return false;
			}
		},
		[projectState, currentProjectPath, onProjectSaved, onError],
	);

	// 公开保存接口
	const saveProject = useCallback(
		async (forceSaveAs = false): Promise<boolean> => {
			return saveProjectCore(forceSaveAs);
		},
		[saveProjectCore],
	);

	// 加载项目
	const loadProject = useCallback(async (): Promise<boolean> => {
		try {
			// 如果有未保存的更改，先提示保存
			if (hasUnsavedChanges) {
				const shouldSave = window.confirm(
					"You have unsaved changes. Save before loading a new project?",
				);
				if (shouldSave) {
					const saved = await saveProjectCore(false);
					if (!saved) return false;
				}
			}

			const result = await window.electronAPI.loadProjectFile();

			if (result.canceled) {
				return false;
			}

			if (!result.success || !result.project) {
				throw new Error(result.error || "Failed to load project");
			}

			const project = result.project as Partial<ProjectState>;

			if (result.path) {
				setCurrentProjectPath(result.path);
			}

			setHasUnsavedChanges(false);
			onProjectLoaded?.(project);
			return true;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Unknown error";
			onError?.(errorMessage);
			return false;
		}
	}, [hasUnsavedChanges, saveProjectCore, onProjectLoaded, onError]);

	// 标记未保存更改
	const markUnsavedChanges = useCallback(() => {
		setHasUnsavedChanges(true);
	}, []);

	// 清除未保存更改标记
	const clearUnsavedChanges = useCallback(() => {
		setHasUnsavedChanges(false);
	}, []);

	// 自动保存逻辑
	useEffect(() => {
		if (!hasUnsavedChanges || !currentProjectPath) return;

		const now = Date.now();
		const timeSinceLastSave = now - lastAutoSaveRef.current;

		// 防抖：如果距离上次保存太近，延迟自动保存
		const delay = Math.max(0, AUTO_SAVE_DEBOUNCE - timeSinceLastSave);

		if (autoSaveTimeoutRef.current) {
			clearTimeout(autoSaveTimeoutRef.current);
		}

		autoSaveTimeoutRef.current = setTimeout(() => {
			saveProjectCore(false);
			lastAutoSaveRef.current = Date.now();
		}, delay);

		return () => {
			if (autoSaveTimeoutRef.current) {
				clearTimeout(autoSaveTimeoutRef.current);
			}
		};
	}, [hasUnsavedChanges, currentProjectPath, saveProjectCore]);

	// 定期自动保存
	useEffect(() => {
		if (!currentProjectPath) return;

		const interval = setInterval(() => {
			if (hasUnsavedChanges) {
				saveProjectCore(false);
				lastAutoSaveRef.current = Date.now();
			}
		}, AUTO_SAVE_INTERVAL);

		return () => clearInterval(interval);
	}, [currentProjectPath, hasUnsavedChanges, saveProjectCore]);

	// 通知主进程未保存状态（用于关闭窗口提示）
	useEffect(() => {
		window.electronAPI.setHasUnsavedChanges(hasUnsavedChanges);
	}, [hasUnsavedChanges]);

	return {
		currentProjectPath,
		hasUnsavedChanges,
		saveProject,
		loadProject,
		markUnsavedChanges,
		clearUnsavedChanges,
	};
}
