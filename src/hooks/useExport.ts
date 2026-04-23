/**
 * 视频导出 Hook
 *
 * 管理视频导出状态（简化版，避免类型冲突）
 */

import { useCallback, useRef, useState } from "react";
import type { ExportProgress } from "@/lib/exporter";

export interface UseExportReturn {
	/** 是否正在导出 */
	isExporting: boolean;
	/** 导出进度 */
	progress: ExportProgress | null;
	/** 开始导出 */
	startExport: () => void;
	/** 完成导出 */
	finishExport: () => void;
	/** 取消导出 */
	cancelExport: () => void;
	/** 更新进度 */
	updateProgress: (progress: ExportProgress) => void;
}

export function useExport(): UseExportReturn {
	const [isExporting, setIsExporting] = useState(false);
	const [progress, setProgress] = useState<ExportProgress | null>(null);
	const abortControllerRef = useRef<AbortController | null>(null);

	const startExport = useCallback(() => {
		setIsExporting(true);
		setProgress(null);
		abortControllerRef.current = new AbortController();
	}, []);

	const finishExport = useCallback(() => {
		setIsExporting(false);
		setProgress(null);
		abortControllerRef.current = null;
	}, []);

	const cancelExport = useCallback(() => {
		abortControllerRef.current?.abort();
		setIsExporting(false);
		setProgress(null);
		abortControllerRef.current = null;
	}, []);

	const updateProgress = useCallback((p: ExportProgress) => {
		setProgress(p);
	}, []);

	return {
		isExporting,
		progress,
		startExport,
		finishExport,
		cancelExport,
		updateProgress,
	};
}
