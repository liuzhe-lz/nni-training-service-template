from pathlib import Path
from .config import Local2Config

config_class = Local2Config
node_module_path = Path(__file__).parent / 'local2_node'
node_class_name = 'Local2EnvironmentService'
