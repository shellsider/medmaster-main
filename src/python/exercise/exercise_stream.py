#!/usr/bin/env python
import sys
import cv2
import numpy as np
import mediapipe as mp
import json
import base64
import time

# Initialize MediaPipe Pose and drawing utilities.
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils

def calculate_angle(a, b, c):
    """Calculate the angle (in degrees) between three points using the cosine rule."""
    a = np.array([a.x, a.y])
    b = np.array([b.x, b.y])
    c = np.array([c.x, c.y])
    ba = a - b
    bc = c - b
    cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
    angle = np.degrees(np.arccos(np.clip(cosine_angle, -1.0, 1.0)))
    return angle

def process_stream(exercise_type, video_path=None):
    # If a video path is provided, use it; otherwise, use the webcam (device 0).
    # Force the DirectShow backend by passing cv2.CAP_DSHOW.
    cap = cv2.VideoCapture(video_path if video_path else 0, cv2.CAP_DSHOW)
    rep_count = 0
    is_active = False

    with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            # Convert frame from BGR to RGB.
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = pose.process(frame_rgb)

            # Process landmarks and update rep count based on the selected exercise.
            if results.pose_landmarks:
                landmarks = results.pose_landmarks.landmark

                if exercise_type == "Bench Press":
                    angle = calculate_angle(
                        landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER],
                        landmarks[mp_pose.PoseLandmark.LEFT_ELBOW],
                        landmarks[mp_pose.PoseLandmark.LEFT_WRIST]
                    )
                    if angle < 90 and not is_active:
                        is_active = True
                    elif angle > 160 and is_active:
                        rep_count += 1
                        is_active = False

                elif exercise_type == "Bicep Curls":
                    angle = calculate_angle(
                        landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER],
                        landmarks[mp_pose.PoseLandmark.LEFT_ELBOW],
                        landmarks[mp_pose.PoseLandmark.LEFT_WRIST]
                    )
                    if angle < 45 and not is_active:
                        is_active = True
                    elif angle > 160 and is_active:
                        rep_count += 1
                        is_active = False

                elif exercise_type == "Lateral Raises":
                    angle = calculate_angle(
                        landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER],
                        landmarks[mp_pose.PoseLandmark.LEFT_ELBOW],
                        landmarks[mp_pose.PoseLandmark.LEFT_WRIST]
                    )
                    if angle > 90 and not is_active:
                        is_active = True
                    elif angle < 40 and is_active:
                        rep_count += 1
                        is_active = False

                elif exercise_type == "Squats":
                    if landmarks[mp_pose.PoseLandmark.LEFT_HIP].y > landmarks[mp_pose.PoseLandmark.LEFT_KNEE].y:
                        is_active = True
                    elif landmarks[mp_pose.PoseLandmark.LEFT_HIP].y < landmarks[mp_pose.PoseLandmark.LEFT_KNEE].y and is_active:
                        rep_count += 1
                        is_active = False

                elif exercise_type == "Push-ups":
                    if landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER].y > landmarks[mp_pose.PoseLandmark.LEFT_ELBOW].y:
                        is_active = True
                    elif landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER].y < landmarks[mp_pose.PoseLandmark.LEFT_ELBOW].y and is_active:
                        rep_count += 1
                        is_active = False

                elif exercise_type == "Shoulder Presses":
                    if landmarks[mp_pose.PoseLandmark.LEFT_ELBOW].y > landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER].y:
                        is_active = True
                    elif landmarks[mp_pose.PoseLandmark.LEFT_ELBOW].y < landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER].y and is_active:
                        rep_count += 1
                        is_active = False

            # Overlay the rep count on the frame.
            cv2.putText(frame, f"Reps: {rep_count}", (50, 50),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

            # Encode the frame as JPEG.
            ret2, buffer = cv2.imencode('.jpg', frame)
            if not ret2:
                continue
            jpg_as_text = base64.b64encode(buffer).decode('utf-8')
            data = {"rep_count": rep_count, "frame": jpg_as_text}
            # Print JSON object and flush immediately.
            print(json.dumps(data), flush=True)
            time.sleep(0.05)

    cap.release()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python exercise_stream.py <exercise_type> [video_file_path]", file=sys.stderr)
        sys.exit(1)
    exercise_type = sys.argv[1]
    video_path = sys.argv[2] if len(sys.argv) > 2 else None
    process_stream(exercise_type, video_path)
