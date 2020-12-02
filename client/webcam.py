import time
import base64
from multiprocessing import Queue

import socketio
import cv2

import config                         # Import config module
from enums import Namespaces, Task    # Import socketio namespaces enum and tasks


#   Initialize global variables
WEB_CAMERA_NAMESPACE: str = Namespaces.WEB_CAMERA.value      # Assign value of WEB_CAMERA enum member
streaming = False         
capture = None
sio = socketio.Client()

#   Create video capture object
def create_video_capture():
    global capture
    while capture is None:
        capture = cv2.VideoCapture(0)
        if capture.isOpened():
            break
        time.sleep(0.5)


#   Release video capture
def end_video_stream():
    global streaming
    try:
        if capture is not None:
            capture.release()
        streaming = False
    except:
        pass


#   Get frame from webcam
def get_video_frame():
    while True:
        ret, video_frame = capture.read()
        if video_frame is None:
            time.sleep(0.5)
            continue
        
        yield video_frame


#   On connection, try to connect to the primary camera connected the computer
@sio.event(namespace=WEB_CAMERA_NAMESPACE)
def connect():
    # DEBUG
    print("Webcam process connected to {} namespace".format(WEB_CAMERA_NAMESPACE))
    pass


#   On disconnection, disconnect from the camera by releasing the capture object
@sio.event(namespace=WEB_CAMERA_NAMESPACE)
def disconnect():
    # DEBUG
    print("Webcam process disconnected to {} namespace".format(WEB_CAMERA_NAMESPACE))
    end_video_stream()


def webcam(data: dict, communicationQueue: Queue):
    # DEBUG
    print("Web camera process - passed data: ", data)

    try: 
        # Connect to server
        sio.connect("http://{}:{}/?userType={}&uuid={}".format(config.SERVER, config.PORT, config.USER_TYPE, config.UUID), namespaces=[WEB_CAMERA_NAMESPACE])
        print("SID is ", sio.sid)
    except:
        pass

    if sio.connected:              # If the client is connected to the server, 
        create_video_capture()     # create the capture object using the default web camera
        global streaming
        streaming = True           # and change the streaming flag to TRUE.

        while streaming:    
            try:
                time.sleep(0.05) 
                frame = next(get_video_frame())             # Get frame from generator
                res, frame = cv2.imencode('.jpg', frame)    # convert from image to binary buffer
                encodedFrame = base64.b64encode(frame)      # Convert to base64

                data["frame"] = encodedFrame                # Add encoded frame to data dictionary

                if communicationQueue.empty() == False:     
                    task = communicationQueue.get()
                    if task == Task.STOP.value:
                        raise Exception("Stopping stream")  # End the stream if the task is "stop"

                if sio.connected:                           # Check if client is still connected
                    sio.emit("video_stream", data, namespace=WEB_CAMERA_NAMESPACE)   # Send data with encoded frame to server

            except:
                end_video_stream()
                if sio.connected:
                    sio.disconnect()
