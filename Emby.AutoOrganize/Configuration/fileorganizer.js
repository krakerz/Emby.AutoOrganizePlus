define(['dialogHelper', 'loading', 'pluginManager', 'emby-checkbox', 'emby-input', 'emby-button', 'emby-select', 'paper-icon-button-light', 'formDialogStyle', 'emby-scroller', 'emby-dialogclosebutton'], function (dialogHelper, loading, pluginManager) {
    'use strict';

    var chosenType;
    var extractedName;
    var extractedYear;
    var currentNewItem;
    var existingMediasHtml;
    var mediasLocationsCount = 0;
    var mediaPaths = {};
    var tvOptions;
    var currentItem;

    function onApiCommandCompleted(response) {

        var obj = this;
        var instance = obj.instance;
        var eventName = obj.eventName;

        events.trigger(instance, 'message', [{

            MessageType: eventName,
            Data: {
                IsLocalEvent: true
            }

        }]);

        return response;
    }

    function performEpisodeOrganization(apiClient, id, options) {

        var url = apiClient.getUrl("Library/AutoOrganizePlus/FileOrganizations/" + id + "/Episode/Organize");

        return apiClient.ajax({
            type: "POST",
            url: url,
            data: JSON.stringify(options),
            contentType: 'application/json'
        }).then(onApiCommandCompleted.bind({
            instance: apiClient,
            eventName: 'AutoOrganizePlus_ItemUpdated'
        }));
    }

    function performMovieOrganization(apiClient, id, options) {

        var url = apiClient.getUrl("Library/AutoOrganizePlus/FileOrganizations/" + id + "/Movie/Organize");

        return apiClient.ajax({
            type: "POST",
            url: url,
            data: JSON.stringify(options),
            contentType: 'application/json'
        }).then(onApiCommandCompleted.bind({
            instance: apiClient,
            eventName: 'AutoOrganizePlus_ItemUpdated'
        }));
    }

    function onApiFailure(e) {

        loading.hide();

        require(['alert'], function (alert) {
            alert({
                title: 'Error',
                text: 'Error: ' + e.headers.get("X-Application-Error-Code")
            });
        });
    }

    function initBaseForm(context, item) {

        context.querySelector('#hfResultId').value = item.Id;

        extractedName = item.ExtractedName;
        extractedYear = item.ExtractedYear;
    }

    function initMovieForm(context, item) {

        initBaseForm(context, item);

        chosenType = 'Movie';

        populateMedias(context);
    }

    function populateMedias(context) {

        loading.show();
        ApiClient.getItems(null, {
            recursive: true,
            includeItemTypes: chosenType,
            sortBy: 'SortName',
            fields: 'Path'

        }).then(function (result) {

            loading.hide();

            mediaPaths = {};
            result.Items.forEach(function (s) {
                mediaPaths[s.Id] = s.Path;
            });

            existingMediasHtml = result.Items.map(function (s) {

                return '<option value="' + s.Id + '">' + s.Name + '</option>';

            }).join('');

            existingMediasHtml = '<option value=""></option>' + existingMediasHtml;

            context.querySelector('#selectMedias').innerHTML = existingMediasHtml;

            ApiClient.getVirtualFolders().then(function (result) {

                var mediasLocations = [];
                result = result.Items || result;
                for (var n = 0; n < result.length; n++) {

                    var virtualFolder = result[n];

                    for (var i = 0, length = virtualFolder.Locations.length; i < length; i++) {
                        var location = {
                            value: virtualFolder.Locations[i],
                            display: virtualFolder.Name + ': ' + virtualFolder.Locations[i]
                        };

                        if ((chosenType == 'Movie' && virtualFolder.CollectionType == 'movies') ||
                            (chosenType == 'Series' && virtualFolder.CollectionType == 'tvshows')) {
                            mediasLocations.push(location);
                        }
                    }
                }

                mediasLocationsCount = mediasLocations.length;

                var mediasFolderHtml = mediasLocations.map(function (s) {
                    return '<option value="' + s.value + '">' + s.display + '</option>';
                }).join('');

                if (mediasLocations.length > 1) {
                    // If the user has multiple folders, add an empty item to enforce a manual selection
                    mediasFolderHtml = '<option value=""></option>' + mediasFolderHtml;
                }

                context.querySelector('#selectMediaFolder').innerHTML = mediasFolderHtml;

                updateTargetPreview(context);

            }, onApiFailure);

        }, onApiFailure);
    }

    function initEpisodeForm(context, item) {

        initBaseForm(context, item);

        chosenType = 'Series';

        if (!item.ExtractedName || item.ExtractedName.length < 3) {
            context.querySelector('.fldRemember').classList.add('hide');
        }
        else {
            context.querySelector('.fldRemember').classList.remove('hide');
        }

        context.querySelector('#txtSeason').value = item.ExtractedSeasonNumber;
        context.querySelector('#txtEpisode').value = item.ExtractedEpisodeNumber;
        context.querySelector('#txtEndingEpisode').value = item.ExtractedEndingEpisodeNumber;

        context.querySelector('#chkRememberCorrection').checked = false;

        initAbsoluteRuleField(context, item);

        tvOptions = null;
        ApiClient.getNamedConfiguration('autoorganizeplus').then(function (config) {
            tvOptions = config.TvOptions;
            updateTargetPreview(context);
        });

        populateMedias(context);
    }

    function replaceAll(value, find, replacement) {

        return value.split(find).join(String(replacement));
    }

    function padNumber(value, width) {

        var text = String(value);

        while (text.length < width) {
            text = '0' + text;
        }

        return text;
    }

    // Mirrors EpisodeFileOrganizer.GetSeriesDirectoryName
    function getSeriesFolderName(seriesName, seriesYear) {

        var fullName = seriesName;

        if (seriesYear && fullName.slice(-6) !== '(' + seriesYear + ')') {
            fullName += ' (' + seriesYear + ')';
        }

        var result = replaceAll(tvOptions.SeriesFolderPattern || '%fn', '%sn', seriesName);
        result = replaceAll(result, '%s.n', seriesName.replace(/ /g, '.'));
        result = replaceAll(result, '%s_n', seriesName.replace(/ /g, '_'));
        result = replaceAll(result, '%fn', fullName);
        result = replaceAll(result, '%sy', seriesYear || '');

        return result.replace(/[. ]+$/, '');
    }

    // Mirrors EpisodeFileOrganizer.GetSeasonFolderPath
    function getSeasonFolderName(season) {

        if (season === 0) {
            return tvOptions.SeasonZeroFolderName;
        }

        var result = replaceAll(tvOptions.SeasonFolderPattern, '%s', season);
        result = replaceAll(result, '%0s', padNumber(season, 2));
        return replaceAll(result, '%00s', padNumber(season, 3));
    }

    // Mirrors EpisodeFileOrganizer.SetEpisodeFileName, including its replacement order
    function getEpisodeFileName(seriesName, season, episode, endingEpisode, originalFileName) {

        var dot = originalFileName.lastIndexOf('.');
        var extension = dot === -1 ? '' : originalFileName.slice(dot + 1);
        var fileName = dot === -1 ? originalFileName : originalFileName.slice(0, dot);
        var pattern = endingEpisode != null ? tvOptions.MultiEpisodeNamePattern : tvOptions.EpisodeNamePattern;

        var result = replaceAll(pattern || '', '%sn', seriesName);
        result = replaceAll(result, '%s.n', seriesName.replace(/ /g, '.'));
        result = replaceAll(result, '%s_n', seriesName.replace(/ /g, '_'));
        result = replaceAll(result, '%s', season);
        result = replaceAll(result, '%0s', padNumber(season, 2));
        result = replaceAll(result, '%00s', padNumber(season, 3));
        result = replaceAll(result, '%ext', extension);
        result = replaceAll(result, '%en', '%#1');
        result = replaceAll(result, '%e.n', '%#2');
        result = replaceAll(result, '%e_n', '%#3');
        result = replaceAll(result, '%fn', fileName);

        if (endingEpisode != null) {
            result = replaceAll(result, '%ed', endingEpisode);
            result = replaceAll(result, '%0ed', padNumber(endingEpisode, 2));
            result = replaceAll(result, '%00ed', padNumber(endingEpisode, 3));
        }

        result = replaceAll(result, '%e', episode);
        result = replaceAll(result, '%0e', padNumber(episode, 2));
        result = replaceAll(result, '%00e', padNumber(episode, 3));

        result = replaceAll(result, '%#1', '{episode title}');
        result = replaceAll(result, '%#2', '{episode.title}');
        return replaceAll(result, '%#3', '{episode_title}').trim();
    }

    function getTargetPreview(context) {

        var season = parseInt(context.querySelector('#txtSeason').value, 10);
        var episode = parseInt(context.querySelector('#txtEpisode').value, 10);
        var endingEpisode = parseInt(context.querySelector('#txtEndingEpisode').value, 10);

        if (isNaN(season) || isNaN(episode)) {
            return 'Enter a season and episode number.';
        }

        var select = context.querySelector('#selectMedias');
        var seriesPath;
        var seriesName;

        if (select.value == '##NEW##' && currentNewItem) {
            seriesName = currentNewItem.Name;
            var rootFolder = context.querySelector('#selectMediaFolder').value || '{root folder}';
            seriesPath = rootFolder + (rootFolder.indexOf('\\') !== -1 ? '\\' : '/') + getSeriesFolderName(seriesName, currentNewItem.ProductionYear);
        } else if (select.value && mediaPaths[select.value]) {
            seriesName = select.options[select.selectedIndex].text;
            seriesPath = mediaPaths[select.value];
        } else {
            return 'Select a series.';
        }

        var separator = seriesPath.indexOf('\\') !== -1 ? '\\' : '/';

        return seriesPath + separator + getSeasonFolderName(season) + separator +
            getEpisodeFileName(seriesName, season, episode, isNaN(endingEpisode) ? null : endingEpisode, currentItem.OriginalFileName);
    }

    function updateTargetPreview(context) {

        var fld = context.querySelector('.fldTargetPreview');

        if (chosenType !== 'Series' || !tvOptions || !currentItem) {
            fld.classList.add('hide');
            return;
        }

        fld.classList.remove('hide');
        context.querySelector('.targetPreview').textContent = getTargetPreview(context);
    }

    // Only files with an episode number but no season ("[ASW] Anime 13") can seed an absolute episode rule
    function canRememberAbsoluteRule(item) {

        return item.ExtractedName && item.ExtractedName.length >= 3 &&
            item.ExtractedSeasonNumber == null && item.ExtractedEpisodeNumber != null;
    }

    function initAbsoluteRuleField(context, item) {

        var fld = context.querySelector('.fldRememberAbsolute');

        context.querySelector('#chkRememberAbsolute').checked = false;

        if (!canRememberAbsoluteRule(item)) {
            fld.classList.add('hide');
            return;
        }

        fld.classList.remove('hide');

        var update = function () {
            updateAbsoluteRuleDescription(context, item);
        };

        context.querySelector('#txtSeason').addEventListener('input', update);
        context.querySelector('#txtEpisode').addEventListener('input', update);
        update();
    }

    function updateAbsoluteRuleDescription(context, item) {

        var season = context.querySelector('#txtSeason').value;
        var episode = context.querySelector('#txtEpisode').value;
        var text = 'Future files named "' + item.ExtractedName + '" without a season continue from here: file episode ' + item.ExtractedEpisodeNumber;

        if (season !== '' && episode !== '') {
            text += ' → Season ' + season + ', Episode ' + episode + ', and ' + (item.ExtractedEpisodeNumber + 1) + ' → Episode ' + (parseInt(episode, 10) + 1) + ', etc.';
        } else {
            text += ' → the season and episode above.';
        }

        text += ' Leave unchecked for specials and one-offs. Season 0 is never remembered.';

        context.querySelector('.absoluteRuleDescription').textContent = text;
    }

    function submitMediaForm(dlg) {

        loading.show();

        var resultId = dlg.querySelector('#hfResultId').value;
        var mediaId = dlg.querySelector('#selectMedias').value;

        var targetFolder = null;
        var newProviderIds = null;
        var newMediaName = null;
        var newMediaYear = null;

        if (mediaId == "##NEW##" && currentNewItem != null) {
            mediaId = null;
            newProviderIds = currentNewItem.ProviderIds;
            newMediaName = currentNewItem.Name;
            newMediaYear = currentNewItem.ProductionYear;
            targetFolder = dlg.querySelector('#selectMediaFolder').value;
        }

        if (chosenType == 'Series') {
            var options = {

                SeriesId: mediaId,
                SeasonNumber: dlg.querySelector('#txtSeason').value,
                EpisodeNumber: dlg.querySelector('#txtEpisode').value,
                EndingEpisodeNumber: dlg.querySelector('#txtEndingEpisode').value,
                RememberCorrection: dlg.querySelector('#chkRememberCorrection').checked,
                RememberAbsoluteMapping: !dlg.querySelector('.fldRememberAbsolute').classList.contains('hide') &&
                    dlg.querySelector('#chkRememberAbsolute').checked,
                NewSeriesProviderIds: newProviderIds,
                NewSeriesName: newMediaName,
                NewSeriesYear: newMediaYear,
                TargetFolder: targetFolder
            };

            performEpisodeOrganization(ApiClient, resultId, options).then(function () {

                loading.hide();

                dlg.submitted = true;
                dialogHelper.close(dlg);

            }, onApiFailure);
        } else if (chosenType == 'Movie') {
            var options = {

                MovieId: mediaId,
                NewMovieProviderIds: newProviderIds,
                NewMovieName: newMediaName,
                NewMovieYear: newMediaYear,
                TargetFolder: targetFolder
            };

            performMovieOrganization(ApiClient, resultId, options).then(function () {

                loading.hide();

                dlg.submitted = true;
                dialogHelper.close(dlg);

            }, onApiFailure);
        }


    }

    function showNewMediaDialog(dlg) {

        if (mediasLocationsCount == 0) {

            require(['alert'], function (alert) {
                alert({
                    title: 'Error',
                    text: 'No TV libraries are configured in Emby library setup.'
                });
            });
            return;
        }

        require(['itemIdentifier'], function (itemIdentifier) {

            itemIdentifier.showFindNew(extractedName, extractedYear, chosenType, ApiClient.serverId()).then(function (newItem) {

                if (newItem != null) {
                    currentNewItem = newItem;
                    var mediasHtml = existingMediasHtml;
                    mediasHtml = mediasHtml + '<option selected value="##NEW##">' + currentNewItem.Name + '</option>';
                    dlg.querySelector('#selectMedias').innerHTML = mediasHtml;
                    selectedMediasChanged(dlg);
                    updateTargetPreview(dlg);
                }
            });
        });
    }

    function selectedMediasChanged(dlg) {
        var mediasId = dlg.querySelector('#selectMedias').value;

        if (mediasId == "##NEW##") {
            dlg.querySelector('.fldSelectMediaFolder').classList.remove('hide');
            dlg.querySelector('#selectMediaFolder').setAttribute('required', 'required');
        }
        else {
            dlg.querySelector('.fldSelectMediaFolder').classList.add('hide');
            dlg.querySelector('#selectMediaFolder').removeAttribute('required');
        }
    }

    function selectedMediaTypeChanged(dlg, item) {
        var mediaType = dlg.querySelector('#selectMediaType').value;

        switch (mediaType) {
            case "":
                dlg.querySelector('#divPermitChoice').classList.add('hide');
                dlg.querySelector('#divGlobalChoice').classList.add('hide');
                dlg.querySelector('#divEpisodeChoice').classList.add('hide');
                break;
            case "Movie":
                dlg.querySelector('#selectMedias').setAttribute('label', 'Movie');
                dlg.querySelector('#selectMedias').setLabel('Movie');

                dlg.querySelector('#divPermitChoice').classList.remove('hide');
                dlg.querySelector('#divGlobalChoice').classList.remove('hide');
                dlg.querySelector('#divEpisodeChoice').classList.add('hide');

                dlg.querySelector('#txtSeason').removeAttribute('required');
                dlg.querySelector('#txtEpisode').removeAttribute('required');

                initMovieForm(dlg, item);

                break;
            case "Episode":
                dlg.querySelector('#selectMedias').setAttribute('label', 'Series');
                dlg.querySelector('#selectMedias').setLabel('Series');

                dlg.querySelector('#divPermitChoice').classList.remove('hide');
                dlg.querySelector('#divGlobalChoice').classList.remove('hide');
                dlg.querySelector('#divEpisodeChoice').classList.remove('hide');

                dlg.querySelector('#txtSeason').setAttribute('required', 'required');
                dlg.querySelector('#txtEpisode').setAttribute('required', 'required');

                initEpisodeForm(dlg, item);
                break;
        }
    }

    return {
        show: function (item) {
            return new Promise(function (resolve, reject) {

                extractedName = null;
                extractedYear = null;
                currentNewItem = null;
                currentItem = item;
                tvOptions = null;
                mediaPaths = {};
                existingMediasHtml = null;

                var xhr = new XMLHttpRequest();
                xhr.open('GET', pluginManager.getConfigurationResourceUrl('AutoOrganizePlusFileOrganizerHtml'), true);

                xhr.onload = function (e) {

                    var template = this.response;
                    var dlg = dialogHelper.createDialog({
                        removeOnClose: true,
                        size: 'small'
                    });

                    dlg.classList.add('ui-body-a');
                    dlg.classList.add('background-theme-a');

                    dlg.classList.add('formDialog');

                    var html = '';

                    html += template;

                    dlg.innerHTML = html;

                    dlg.querySelector('.formDialogHeaderTitle').innerHTML = 'Organize';
                    dlg.querySelector('.inputFile').innerHTML = item.OriginalFileName;

                    dialogHelper.open(dlg);

                    dlg.addEventListener('close', function () {

                        if (dlg.submitted) {
                            resolve();
                        } else {
                            reject();
                        }
                    });

                    dlg.querySelector('form').addEventListener('submit', function (e) {

                        submitMediaForm(dlg);

                        e.preventDefault();
                        return false;
                    });

                    dlg.querySelector('#btnNewMedia').addEventListener('click', function (e) {

                        showNewMediaDialog(dlg);
                    });

                    dlg.querySelector('#selectMedias').addEventListener('change', function (e) {

                        selectedMediasChanged(dlg);
                        updateTargetPreview(dlg);
                    });

                    ['#txtSeason', '#txtEpisode', '#txtEndingEpisode', '#selectMediaFolder'].forEach(function (selector) {
                        dlg.querySelector(selector).addEventListener(selector === '#selectMediaFolder' ? 'change' : 'input', function () {
                            updateTargetPreview(dlg);
                        });
                    });

                    dlg.querySelector('#selectMediaType').addEventListener('change', function (e) {

                        selectedMediaTypeChanged(dlg, item);
                    });

                    dlg.querySelector('#selectMediaType').value = item.Type;

                    // Init media type
                    selectedMediaTypeChanged(dlg, item);
                }

                xhr.send();
            });
        }
    };
});