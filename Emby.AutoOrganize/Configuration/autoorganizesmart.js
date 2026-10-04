define(['loading', 'mainTabsManager', 'dialogHelper', 'listViewStyle', 'formDialogStyle', 'emby-input', 'emby-select', 'emby-textarea', 'emby-button', 'paper-icon-button-light', 'emby-scroller', 'emby-dialogclosebutton'], function (loading, mainTabsManager, dialogHelper) {
    'use strict';

    function getSmartMatchInfos(apiClient, options) {

        options = options || {};

        var url = apiClient.getUrl("Library/AutoOrganizePlus/FileOrganizations/SmartMatches", options);

        return apiClient.ajax({
            type: "GET",
            url: url,
            dataType: "json"
        });
    }

    function deleteSmartMatchEntries(apiClient, entries) {

        var url = apiClient.getUrl("Library/AutoOrganizePlus/FileOrganizations/SmartMatches/Delete");

        var postData = {
            Entries: entries
        };

        return apiClient.ajax({

            type: "POST",
            url: url,
            data: JSON.stringify(postData),
            contentType: "application/json"
        });
    };

    function escapeHtml(value) {

        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function getAbsoluteRules(apiClient) {

        return apiClient.ajax({
            type: "GET",
            url: apiClient.getUrl("Library/AutoOrganizePlus/AbsoluteEpisodeMappings"),
            dataType: "json"
        });
    }

    function saveAbsoluteRule(apiClient, rule) {

        return apiClient.ajax({
            type: "POST",
            url: apiClient.getUrl("Library/AutoOrganizePlus/AbsoluteEpisodeMappings"),
            data: JSON.stringify(rule),
            contentType: "application/json"
        });
    }

    function deleteAbsoluteRule(apiClient, id) {

        return apiClient.ajax({
            type: "DELETE",
            url: apiClient.getUrl("Library/AutoOrganizePlus/AbsoluteEpisodeMappings/" + id)
        });
    }

    var currentRules = [];

    function pad2(n) {

        return n < 10 ? '0' + n : '' + n;
    }

    function getRangeText(range) {

        return 'From episode ' + range.FromEpisode + ' \u2192 Season ' + range.SeasonNumber + ', starting at episode ' + range.StartAt +
            ' (' + range.FromEpisode + ' = S' + pad2(range.SeasonNumber) + 'E' + pad2(range.StartAt) + ')';
    }

    function reloadAbsoluteRules(page) {

        return getAbsoluteRules(ApiClient).then(function (rules) {

            currentRules = rules || [];
            populateAbsoluteRules(page, currentRules);
        });
    }

    function populateAbsoluteRules(page, rules) {

        var html = '';

        if (rules.length) {
            html += '<div class="paperList">';
        }

        for (var i = 0, length = rules.length; i < length; i++) {

            var rule = rules[i];

            html += '<div class="listItem">';
            html += '<div class="listItemIconContainer"><i class="listItemIcon md-icon">format_list_numbered</i></div>';
            html += '<div class="listItemBody">';
            html += "<h2 class='listItemBodyText'>" + escapeHtml(rule.SeriesName) + "</h2>";
            html += "<div class='listItemBodyText secondary'>Files: " + rule.MatchStrings.map(escapeHtml).join(', ') + "</div>";

            rule.Ranges.forEach(function (range) {
                html += "<div class='listItemBodyText secondary'>" + escapeHtml(getRangeText(range)) + "</div>";
            });

            html += '</div>';
            html += '<button type="button" is="paper-icon-button-light" class="btnEditAbsoluteRule" data-index="' + i + '" title="Edit"><i class="md-icon">edit</i></button>';
            html += '<button type="button" is="paper-icon-button-light" class="btnDeleteAbsoluteRule" data-index="' + i + '" title="Delete"><i class="md-icon">delete</i></button>';
            html += '</div>';
        }

        if (rules.length) {
            html += '</div>';
        }

        page.querySelector('.divAbsoluteRules').innerHTML = html;
    }

    function getRangeRowHtml(range) {

        range = range || { FromEpisode: '', SeasonNumber: '', StartAt: 1 };

        var html = '<div class="absoluteRangeRow flex align-items-center" style="gap: 1em;">';
        html += '<div class="inputContainer flex-grow"><input is="emby-input" class="txtFromEpisode" type="number" min="0" required label="From file episode:" value="' + range.FromEpisode + '" /></div>';
        html += '<div class="inputContainer flex-grow"><input is="emby-input" class="txtSeasonNumber" type="number" min="0" required label="Season:" value="' + range.SeasonNumber + '" /></div>';
        html += '<div class="inputContainer flex-grow"><input is="emby-input" class="txtStartAt" type="number" min="0" required label="Starts at episode:" value="' + range.StartAt + '" /></div>';
        html += '<button type="button" is="paper-icon-button-light" class="btnRemoveRange" title="Remove"><i class="md-icon">delete</i></button>';
        html += '</div>';

        return html;
    }

    function showAbsoluteRuleEditor(page, rule) {

        var dlg = dialogHelper.createDialog({
            removeOnClose: true,
            size: 'small'
        });

        dlg.classList.add('ui-body-a');
        dlg.classList.add('background-theme-a');
        dlg.classList.add('formDialog');

        var html = '';
        html += '<div class="formDialogHeader"><button type="button" is="emby-dialogclosebutton"></button><h3 class="formDialogHeaderTitle">' + (rule ? 'Edit' : 'Add') + ' absolute episode rule</h3></div>';
        html += '<div is="emby-scroller" data-horizontal="false" data-forcescrollbar="true" data-focusscroll="true" class="formDialogContent"><div class="scrollSlider">';
        html += '<form class="dialogContentInner dialog-content-centered padded-left padded-right">';
        html += '<div class="selectContainer"><select is="emby-select" class="selectSeries" required label="Series:"></select></div>';
        html += '<div class="inputContainer"><textarea is="emby-textarea" class="txtMatchStrings" required rows="3" label="File names (one per line):"></textarea>';
        html += '<div class="fieldDescription">The series name as parsed from the file, e.g. "[ASW] Anime" for "[ASW] Anime - 13 [1080p].mkv". Shown in the activity log after a failed run.</div></div>';
        html += '<h3>Ranges</h3>';
        html += '<div class="absoluteRanges"></div>';
        html += '<button is="emby-button" type="button" class="btnAddRange"><i class="md-icon">add</i><span>Add range</span></button>';
        html += '<div class="fieldDescription">Example: Season 1 has 12 episodes \u2192 ranges "1 \u2192 Season 1, starts at 1" and "13 \u2192 Season 2, starts at 1", so file episode 13 becomes S02E01. Use "starts at 13" if the provider keeps counting in season 2.</div>';
        html += '<div class="formDialogFooter"><button is="emby-button" type="submit" class="raised button-submit block formDialogFooterItem"><span>Save</span></button></div>';
        html += '</form></div></div>';

        dlg.innerHTML = html;

        var rangesElem = dlg.querySelector('.absoluteRanges');
        var ranges = rule ? rule.Ranges : [{ FromEpisode: 1, SeasonNumber: 1, StartAt: 1 }];

        rangesElem.innerHTML = ranges.map(getRangeRowHtml).join('');
        dlg.querySelector('.txtMatchStrings').value = rule ? rule.MatchStrings.join('\n') : '';

        dlg.querySelector('.btnAddRange').addEventListener('click', function () {
            rangesElem.insertAdjacentHTML('beforeend', getRangeRowHtml());
        });

        rangesElem.addEventListener('click', function (e) {
            var btn = parentWithClass(e.target, 'btnRemoveRange');
            if (btn && rangesElem.querySelectorAll('.absoluteRangeRow').length > 1) {
                parentWithClass(btn, 'absoluteRangeRow').remove();
            }
        });

        dlg.querySelector('form').addEventListener('submit', function (e) {

            e.preventDefault();

            var select = dlg.querySelector('.selectSeries');

            var newRule = {
                SeriesId: select.value,
                SeriesName: select.options[select.selectedIndex] ? select.options[select.selectedIndex].text : '',
                MatchStrings: dlg.querySelector('.txtMatchStrings').value.split('\n').map(function (i) { return i.trim(); }).filter(function (i) { return i; }),
                Ranges: Array.prototype.map.call(rangesElem.querySelectorAll('.absoluteRangeRow'), function (row) {
                    return {
                        FromEpisode: parseInt(row.querySelector('.txtFromEpisode').value, 10),
                        SeasonNumber: parseInt(row.querySelector('.txtSeasonNumber').value, 10),
                        StartAt: parseInt(row.querySelector('.txtStartAt').value, 10)
                    };
                })
            };

            // A new rule omits Id; the server assigns one
            if (rule) {
                newRule.Id = rule.Id;
            }

            loading.show();

            saveAbsoluteRule(ApiClient, newRule).then(function () {

                loading.hide();
                dialogHelper.close(dlg);
                reloadAbsoluteRules(page);

            }, function (response) {

                loading.hide();
                Dashboard.processErrorResponse(response);
            });

            return false;
        });

        loading.show();

        ApiClient.getItems(null, {
            Recursive: true,
            IncludeItemTypes: 'Series',
            SortBy: 'SortName'

        }).then(function (result) {

            loading.hide();

            var seriesId = rule ? rule.SeriesId : '';
            var options = '<option value=""></option>' + result.Items.map(function (s) {
                return '<option value="' + s.Id + '">' + escapeHtml(s.Name) + '</option>';
            }).join('');

            // Rule remembered for a series not yet scanned into the library
            if (rule && !seriesId) {
                options += '<option value="" selected>' + escapeHtml(rule.SeriesName) + ' (not in library yet)</option>';
            }

            var select = dlg.querySelector('.selectSeries');
            select.innerHTML = options;
            select.value = seriesId || '';

            dialogHelper.open(dlg);

        }, function () {

            loading.hide();
        });
    }

    var query = {

        StartIndex: 0,
        Limit: 100000
    };

    var currentResult;

    function parentWithClass(elem, className) {

        while (!elem.classList || !elem.classList.contains(className)) {
            elem = elem.parentNode;

            if (!elem) {
                return null;
            }
        }

        return elem;
    }

    function reloadList(page) {

        loading.show();

        getSmartMatchInfos(ApiClient, query).then(function (infos) {

            currentResult = infos;

            populateList(page, infos);

            loading.hide();

        }, function () {

            loading.hide();
        });
    }

    function getHtmlFromMatchStrings(info, i) {

        var matchStringIndex = 0;

        return info.MatchStrings.map(function (m) {

            var matchStringHtml = '';

            matchStringHtml += '<div class="listItem">';

            matchStringHtml += '<div class="listItemBody" style="padding: .1em 1em .4em 5.5em; min-height: 1.5em;">';

            matchStringHtml += "<div class='listItemBodyText secondary'>" + m + "</div>";

            matchStringHtml += '</div>';

            matchStringHtml += '<button type="button" is="emby-button" class="btnDeleteMatchEntry" style="padding: 0;" data-index="' + i + '" data-matchindex="' + matchStringIndex + '" title="Delete"><i class="md-icon">delete</i></button>';

            matchStringHtml += '</div>';
            matchStringIndex++;

            return matchStringHtml;

        }).join('');
    }

    function populateList(page, result) {

        var infos = result.Items;

        if (infos.length > 0) {
            infos = infos.sort(function (a, b) {

                a = a.OrganizerType + " " + (a.DisplayName || a.ItemName);
                b = b.OrganizerType + " " + (b.DisplayName || b.ItemName);

                if (a === b) {
                    return 0;
                }

                if (a < b) {
                    return -1;
                }

                return 1;
            });
        }

        var html = "";

        if (infos.length) {
            html += '<div class="paperList">';
        }

        for (var i = 0, length = infos.length; i < length; i++) {

            var info = infos[i];

            html += '<div class="listItem">';

            html += '<div class="listItemIconContainer">';
            html += '<i class="listItemIcon md-icon">folder</i>';
            html += '</div>';

            html += '<div class="listItemBody">';
            html += "<h2 class='listItemBodyText'>" + (info.DisplayName || info.ItemName) + "</h2>";
            html += '</div>';

            html += '</div>';

            html += getHtmlFromMatchStrings(info, i);
        }

        if (infos.length) {
            html += "</div>";
        }

        var matchInfos = page.querySelector('.divMatchInfos');
        matchInfos.innerHTML = html;
    }

    function getTabs() {
        return [
            {
                href: Dashboard.getConfigurationPageUrl('AutoOrganizePlusLog'),
                name: 'Activity Log'
            },
            {
                href: Dashboard.getConfigurationPageUrl('AutoOrganizePlusTv'),
                name: 'TV'
            },
            {
                href: Dashboard.getConfigurationPageUrl('AutoOrganizePlusMovie'),
                name: 'Movie'
            },
            {
                href: Dashboard.getConfigurationPageUrl('AutoOrganizePlusSmart'),
                name: 'Smart Matches'
            }];
    }

    return function (view, params) {

        var self = this;

        var divInfos = view.querySelector('.divMatchInfos');

        view.querySelector('.btnAddAbsoluteRule').addEventListener('click', function () {

            showAbsoluteRuleEditor(view, null);
        });

        view.querySelector('.divAbsoluteRules').addEventListener('click', function (e) {

            var editButton = parentWithClass(e.target, 'btnEditAbsoluteRule');

            if (editButton) {
                showAbsoluteRuleEditor(view, currentRules[parseInt(editButton.getAttribute('data-index'))]);
                return;
            }

            var deleteButton = parentWithClass(e.target, 'btnDeleteAbsoluteRule');

            if (deleteButton) {

                var rule = currentRules[parseInt(deleteButton.getAttribute('data-index'))];

                require(['confirm'], function (confirm) {

                    confirm('Delete the absolute episode rule for ' + rule.SeriesName + '?', 'Delete rule').then(function () {

                        deleteAbsoluteRule(ApiClient, rule.Id).then(function () {

                            reloadAbsoluteRules(view);

                        }, Dashboard.processErrorResponse);
                    });
                });
            }
        });

        divInfos.addEventListener('click', function (e) {

            var button = parentWithClass(e.target, 'btnDeleteMatchEntry');

            if (button) {

                var index = parseInt(button.getAttribute('data-index'));
                var matchIndex = parseInt(button.getAttribute('data-matchindex'));

                var info = currentResult.Items[index];
                var entries = [
                    {
                        Name: info.Id,
                        Value: info.MatchStrings[matchIndex]
                    }];

                deleteSmartMatchEntries(ApiClient, entries).then(function () {

                    reloadList(view);

                }, Dashboard.processErrorResponse);
            }
        });

        view.addEventListener('viewshow', function (e) {

            mainTabsManager.setTabs(this, 3, getTabs);
            loading.show();

            reloadList(view);
            reloadAbsoluteRules(view);
        });

        view.addEventListener('viewhide', function (e) {

            currentResult = null;
        });
    };
});