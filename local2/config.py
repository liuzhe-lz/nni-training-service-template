from dataclasses import dataclass
from nni.experiment.config.common import TrainingServiceConfig

@dataclass(init=False)
class Local2Config(TrainingServiceConfig):
    platform: str = 'local2'
