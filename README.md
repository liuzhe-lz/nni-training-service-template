This is a minimal NNI third-party training service demo, "written in" (compiled to) plain JS.

```sh
python setup.py develop --user
nnictl trainingservice register --package local2

cd mnist
nnictl create --config local2.yml
  (or)
python launch.py
```
