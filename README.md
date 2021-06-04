This is a minimal NNI third-party training service demo, "writtin in" (compiled to) plain JS.

```sh
python setup.py develop --user
nnictl trainingservice register local2

cd mnist
nnictl create --config local2.yml
python launch.py
```
