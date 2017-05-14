let Environment = require('../../core/environment');

let WSClient = require('../../client2server/websocket-client'),
    GET = WSClient.GET;

let Settings = require('../../core/settings').WSClient,
    Timeouts = Settings.Timeouts;

let FR = new FileReader();

let DatasetGet = Settings.get; // 'isovalues' or 'isovaluesAndGradientMagnitudes'

let controller = function ($scope, $timeout) {

    let loaderElement = null;
    let statusElement = null;

    let setLoaderVisibility = (visible) => {
        loaderElement.style.display = visible ? 'block' : 'none';
    }

    let setStatusVisibility = (visible) => {
        statusElement.style.display = visible ? 'block' : 'none';
    }

    $scope.loaderText = "...";
    $scope.loadAutomatically = true && Settings.loadAutomaticallyByDefault;

    $scope.selectedDataset = 'one';
    $scope.datasets = ['one', 'two', 'three'];

    let fetchDatasets = () => {
        setStatusVisibility(false);
        $scope.loaderText = 'Getting list of datasets...';
        setLoaderVisibility(true);
        GET({
            type: 'dataset-list'
        }, true, Timeouts.getDatasetList).then((list) => {
            $scope.loaderText = 'Successfully fetched dataset list';
            setLoaderVisibility(false);
            $scope.datasets = list;
            $scope.selectedDataset = list[0];
            $scope.$apply();

            if ($scope.loadAutomatically)
                $scope.loadSelectedDataset();

            return;

        }).catch((e) => {
            console.error("Timed out getting dataset-list, (timeout = " + Timeouts.getDatasetList + "ms )");
            setLoaderVisibility(false);
        });
    }

    $scope.$watch('selectedDataset', (newValue, oldValue) => {
        if (newValue !== oldValue)
            setStatusVisibility(false);

        if ($scope.loadAutomatically)
            $scope.loadSelectedDataset();
    });

    $scope.loadSelectedDataset = () => {
        setStatusVisibility(false);
        console.log(Timeouts);
        let base = 'Getting dataset ' + $scope.selectedDataset + " ... ";
        $scope.loaderText = base + ' header';

        setLoaderVisibility(true);
        GET({
                    type: 'dataset',
                    dataset: $scope.selectedDataset,
                    field: 'header'
                },
                true,
                Timeouts.getDatasetHeader)

            .then((header) => {
                $scope.loaderText = base + ' isovalues';
                $scope.$apply();



                GET({
                            type: 'dataset',
                            dataset: $scope.selectedDataset,
                            field: DatasetGet//'isovaluesAndGradientMagnitudes'
                        },
                        false,
                        Timeouts.getDatasetIsovalues)

                    .then((arraybuffer) => {
                        $scope.loaderText = 'Successfully fetched dataset ' + $scope.selectedDataset;
                        $scope.$apply();

                        setTimeout(() => {
                            setLoaderVisibility(false);
                            setStatusVisibility(true);
                        }, 2000);

                        let result = new Int16Array(arraybuffer);

                        Environment.notifyDatasetWasLoaded($scope.selectedDataset, header, result);

                    return;

                    })
                    .catch((e) => {
                        $scope.loaderText = 'Timed out getting isovalues (timeout = ' + Timeouts.getDatasetIsovalues + ' ms)';
                        $scope.$apply();
                    })
            })
            .catch((e) => {
                $scope.loaderText = 'Timed out getting header... (max wait = ' + Timeouts.getDatasetHeader + ' ms)';
                $scope.$apply();
                setLoaderVisibility(false);
            });
    }





    $scope.DOMReady = () => {
        loaderElement = document.getElementById('dataset-manager-view-status');
        statusElement = document.getElementById('dataset-manager-status2');
        fetchDatasets();
        Environment.ready('DatasetController');
    }
}

module.exports = controller;
