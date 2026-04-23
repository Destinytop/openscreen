/**
 * Webcam Preview Component for HUD
 *
 * Shows a compact live preview of the webcam with mask shape support
 */

import { useEffect, useRef, useState } from "react";
import type { WebcamMaskShape } from "../video-editor/types";

interface WebcamPreviewProps {
	deviceId?: string;
	enabled: boolean;
	maskShape?: WebcamMaskShape;
	size?: "sm" | "md";
}

export function WebcamPreview({
	deviceId,
	enabled,
	maskShape = "rectangle",
	size = "sm",
}: WebcamPreviewProps) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		if (!enabled) {
			// Clean up stream when disabled
			if (streamRef.current) {
				streamRef.current.getTracks().forEach((track) => track.stop());
				streamRef.current = null;
			}
			return;
		}

		async function initCamera() {
			try {
				setIsLoading(true);
				setError(null);

				const constraints: MediaStreamConstraints = {
					video: {
						width: { ideal: 320 },
						height: { ideal: 240 },
						frameRate: { ideal: 30 },
						deviceId: deviceId ? { exact: deviceId } : undefined,
					},
					audio: false,
				};

				const stream = await navigator.mediaDevices.getUserMedia(constraints);
				streamRef.current = stream;

				if (videoRef.current) {
					videoRef.current.srcObject = stream;
				}
			} catch (err) {
				console.error("Failed to access camera:", err);
				setError("Camera error");
			} finally {
				setIsLoading(false);
			}
		}

		initCamera();

		return () => {
			if (streamRef.current) {
				streamRef.current.getTracks().forEach((track) => track.stop());
				streamRef.current = null;
			}
		};
	}, [enabled, deviceId]);

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

	const sizeClasses = size === "sm" ? "w-16 h-12" : "w-24 h-18";

	if (!enabled) {
		return null;
	}

	return (
		<div
			className={`relative ${sizeClasses} bg-zinc-900 rounded-lg overflow-hidden border border-white/10`}
		>
			{isLoading && (
				<div className="absolute inset-0 flex items-center justify-center">
					<div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
				</div>
			)}

			{error ? (
				<div className="absolute inset-0 flex items-center justify-center text-[8px] text-white/40">
					Error
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
						transform: "scaleX(-1)",
					}}
				/>
			)}
		</div>
	);
}
