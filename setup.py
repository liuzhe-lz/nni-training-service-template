import setuptools

def _setup():
    setuptools.setup(
        name = 'local2',
        version = '0.0.1',

        packages = ['local2'],
        package_data = {
            'local2': ['local2_node/*', 'local2_node/nnilib/*']
        },

        python_requires = '>=3.7',
        install_requires = ['nni'],
    )

if __name__ == '__main__':
    _setup()
