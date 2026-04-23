/**
 * 摄像头预览组件
 *
 * 在源选择器中显示摄像头实时预览，支持遮罩形状
 */

import { useEffect, useRef, useState } from "react";
import { useScopedT } from "@/contexts/I18nContext";
import type { WebcamMaskShape } from "../video-editor/types";
import styles from "./SourceSelector.module.css";

interface CameraPreviewProps {
	maskShape?: WebcamMaskShape;
	onMaskShapeChange?: (shape: WebcamMaskShape) => void;
}

const MASK_SHAPES: { value: WebcamMaskShape; label: string }[] = [
	{ value: "rectangle", label: "方形" },
	{ value: "circle", label: "圆形" },
	{ value: "square", label: "正方形" },
	{ value: "rounded", label: "圆角" },
];

export function CameraPreview({ maskShape = "rectangle", onMaskShapeChange }: CameraPreviewProps) {
	const t = useScopedT("launch");
	const videoRef = useRef<HTMLVideoElement>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		async function initCamera() {
			try {
				setIsLoading(true);
				setError(null);

				// 请求摄像头权限
				const stream = await navigator.mediaDevices.getUserMedia({
					video: {
						width: { ideal: 640 },
						height: { ideal: 480 },
						frameRate: { ideal: 30 },
					},
					audio: false,
				});

				streamRef.current = stream;

				if (videoRef.current) {
					videoRef.current.srcObject = stream;
				}
			} catch (err) {
				console.error("Failed to access camera:", err);
				setError(t("cameraPreview.error"));
			} finally {
				setIsLoading(false);
			}
		}

		initCamera();

		// 清理函数
		return () => {
			if (streamRef.current) {
				streamRef.current.getTracks().forEach((track) => track.stop());
				streamRef.current = null;
			}
		};
	}, [t]);

	const getClipPath = () => {
		switch (maskShape) {
			case "circle":
				return "circle(50%)";
			case "rounded":
				return "inset(0 round 20%)";
			case "square":
			case "rectangle":
			default:
				return undefined;
		}
	};

	return (
		<div className="flex flex-col gap-2">
			{/* 预览区域 */}
			<div
				className={`relative w-full aspect-video bg-zinc-900 rounded-xl overflow-hidden ${styles.glassContainer}`}
			>
				{isLoading && (
					<div className="absolute inset-0 flex items-center justify-center">
						<div className="animate-spin rounded-full h-6 w-6 border-2 border-b-transparent border-[#34B27B]" />
					</div>
				)}

				{error ? (
					<div className="absolute inset-0 flex items-center justify-center text-zinc-500 text-xs">
						{error}
					</div>
				) : (
					<video
						ref={videoRef}
						autoPlay
						playsInline
						muted
						className="w-full h-full object-cover"
						style={{
							clipPath: getClipPath(),
							transform: "scaleX(-1)", // 镜像效果
						}}
					/>
				)}
			</div>

			{/* 遮罩形状选择 */}
			{onMaskShapeChange && (
				<div className="flex gap-1.5 justify-center">
					{MASK_SHAPES.map((shape) => (
						<button
							key={shape.value}
							onClick={() => onMaskShapeChange(shape.value)}
							className={`px-3 py-1 text-xs rounded-full transition-all ${
								maskShape === shape.value
									? "bg-[#34B27B] text-white"
									: "bg-white/10 text-zinc-400 hover:bg-white/20"
							}`}
						>
							{shape.label}
						</button>
					))}
				</div>
			)}
		</div>
	);
}
