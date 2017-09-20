window.tablelayout = window.tablelayout || {};

jQuery(window).on('load', function () {
    'use strict';

    if (jQuery('#tablelayout_printthis').length) {
        window.print();
        return;
    }

    jQuery('.plugin_tablelayout_placeholder').each(function (index, element) {
        var $table = jQuery(element).next().find('table');
        var layoutdata = jQuery(element).data('tablelayout');
        var columnCount = $table.find('tr').toArray().reduce(function (max, row) {
            return Math.max(max, jQuery(row).find('td,th').length);
        }, 0);

        var $secedit_form = jQuery(element).next().next('.secedit').find('form div.no');
        var $input = jQuery('<input name="tablelayout" type="hidden">').val(JSON.stringify(layoutdata));
        $secedit_form.prepend($input);
        if (layoutdata) {
            window.tablelayout.applyStylesToTable($table, layoutdata);
        }

        if (layoutdata.tablePrint) {
            var range = $secedit_form.find('input[name="range"]').val();
            var target = $secedit_form.closest('form').attr('action');
            var params = [
                'do=tablelayout_printtable',
                'range=' + encodeURIComponent(range),
                'id=' + encodeURIComponent(window.JSINFO.id)
            ];
            var href = target + '?' + params.join('&');
            var $link = jQuery('<a>' + window.LANG.plugins.tablelayout.print + '</a>').attr({
                'href': href,
                'target': '_blank'
            }).addClass('button print');
            $secedit_form.closest('div.secedit').append($link);
        }

        if (layoutdata.tableSort || layoutdata.tableSearch) {
            var searchSortRow = jQuery('<tr class="searchSortRow">' + '<th><div></div></th>'.repeat(columnCount) + '</tr>');
            var $lastHeaderRow;
            if ($table.hasClass('tablelayout_body')) {
                $lastHeaderRow = $table.closest('.table').find('table.tablelayout_head tr').last();
            } else {
                $lastHeaderRow = $table.find('tr').slice(layoutdata.rowsHeader - 1).first();
            }
            $lastHeaderRow.after(searchSortRow);
        }

        if (layoutdata.tableSort) {
            var $rowsToBeSorted;
            if ($table.hasClass('tablelayout_body')) {
                $rowsToBeSorted = $table.find('tr');
            } else {
                $rowsToBeSorted = $table.find('tr').slice(parseInt(layoutdata.rowsHeader) + 1);
            }
            var $tableSortRowCells = searchSortRow.find('td > div,th > div');
            $tableSortRowCells.append(jQuery('<button>'));
            var $tableSortRowCellsButtons = $tableSortRowCells.find('button');
            $tableSortRowCellsButtons.addClass('sortable unsorted');
            $tableSortRowCellsButtons.click(function () {
                window.tablelayout.splitMerges($rowsToBeSorted);
                var $this = jQuery(this);
                var sortDirection = $this.hasClass('sorted_asc') ? 'desc' : 'asc';
                $tableSortRowCellsButtons.removeClass('sorted_asc sorted_desc').addClass('unsorted');
                $this.addClass('sorted_' + sortDirection).removeClass('unsorted');
                var colIndex = $this.closest('td,th').prevAll('td,th').length;
                var sortedRows = window.tablelayout.sortTable($rowsToBeSorted.detach(), colIndex, sortDirection);
                $table.append(sortedRows);
                return false;
            });
        }

        if (layoutdata.tableSearch) {
            var $rowsToBeSearched;
            var $tableIncludingHeaders;
            var $container = searchSortRow.closest('.table');
            $container.addClass('hasSearch');
            if ($table.hasClass('tablelayout_body')) {
                $rowsToBeSearched = $table.find('tr');
                $tableIncludingHeaders = $container.find('.tablelayout_head');
            } else {
                $rowsToBeSearched = $table.find('tr').slice(parseInt(layoutdata.rowsHeader) + 1);
                $tableIncludingHeaders = $table;
            }

            searchSortRow.find('td > div,th > div').prepend(jQuery('<input>'));
            var $globalSearch = jQuery('<div class="globalSearch"><label><span>' + window.LANG.plugins.tablelayout.search + '</span><input name="globalSearch" type="text"></label></div>');
            $container.prepend($globalSearch);
            if ($table.width() > $container.width()) {
                $globalSearch.position({my: 'right bottom-3px', at: 'right top', of: $container, collision: 'none'});
            } else {
                $globalSearch.position({
                    my: 'right bottom-3px',
                    at: 'right top',
                    of: $tableIncludingHeaders,
                    collision: 'none'
                });
            }
            var $searchInputs = searchSortRow.find('input').add($globalSearch.find('input'));
            $searchInputs.on('input', function () {
                window.tablelayout.splitMerges($rowsToBeSearched);
                var globalSearchText = $globalSearch.find('input').val().trim().toLowerCase();
                $rowsToBeSearched.each(function (index, row) {
                    var globalRowShow = false;
                    var hideRow = jQuery(row).find('td,th').toArray().some(function (cell, index) {
                        var $this = jQuery(cell);
                        var cellText = $this.text().trim().toLowerCase();
                        globalRowShow = globalRowShow || (cellText.indexOf(globalSearchText) !== -1);
                        var colFilterIndex = index + 1;
                        var searchText = $searchInputs.eq(colFilterIndex).val().trim().toLowerCase();
                        return cellText.indexOf(searchText) === -1;
                    });
                    jQuery(row).css('display', (globalRowShow && !hideRow) ? 'table-row' : 'none');
                });
            });
        }

    });
});
