var Database = {
    db: null
    , select: function(__statement, __args) {
        let _arrResult = [];
        // Prepare a statement
        const _stmt = this.db.prepare(__statement);

        // Bind new values
        if (__args) {
            _stmt.bind(__args);
        }
        while(_stmt.step()) { //
            const _row = _stmt.getAsObject();
            _arrResult.push(_row)
        }

        return _arrResult;
    }
    , getProfiles: function () {
        let _arrResults = this.select("SELECT * FROM profiles where active = 1 order by display_name asc")

        return _arrResults;
    }
    , getItemValues: function (__intProfileId, __txtItemId, __txtScope, __txtxDateFrom, __txtDateTo) {
        var _arrResults = []
        var _txtSelectStatement
        var _txtWhereStatement
        var _txtOrderStatement
        var _txtFullStatement
        var _arrArgs = []

        _txtSelectStatement = "SELECT (strftime('%Y-%m-%d %H:%M:%f', val.entry_date, 'localtime')) as entry_date, items.display_name, val.item_id, val.value \
                              , com.comments, fields.field_id, fields.precision, fields.field_seq, units.display_symbol, items.display_format \
                              FROM monitor_items_values as val \
                              LEFT OUTER JOIN monitor_items_comments as com \
                              ON val.entry_date = com.entry_date \
                              AND val.profile_id = com.profile_id \
                              LEFT OUTER JOIN monitor_items_fields fields \
                              ON val.field_id = fields.field_id \
                              AND val.item_id = fields.item_id \
                              LEFT OUTER JOIN monitor_items items \
                              ON val.item_id = items.item_id \
                              LEFT OUTER JOIN units units \
                              ON fields.unit = units.name"
        _txtWhereStatement = "WHERE val.profile_id = ? \
                              AND date(val.entry_date, 'localtime') BETWEEN date(?) AND date(?)"
        if (__txtItemId !== "all") {
            _txtWhereStatement = _txtWhereStatement + " AND val.item_id = ?"
            _arrArgs = [__intProfileId, __txtxDateFrom, __txtDateTo, __txtItemId]
        } else {
            _arrArgs = [__intProfileId, __txtxDateFrom, __txtDateTo]
        }
        _txtOrderStatement = "ORDER BY val.entry_date asc, val.item_id asc, fields.field_seq asc;"

        _txtFullStatement = _txtSelectStatement + " " + _txtWhereStatement + " " + _txtOrderStatement
        _arrResults = this.select(_txtFullStatement, _arrArgs)

        return _arrResults
    }
    , getDashItems: function () {
        var _arrResults = []
        
        _arrResults = this.select("SELECT dash.item_id, items.display_name, items.display_format \
                  , items.unit, units.display_symbol, dash.value_type, dash.scope \
                  FROM monitor_items_dash dash, monitor_items items \
                  LEFT OUTER JOIN units units ON items.unit = units.name \
                  WHERE dash.item_id = items.item_id")

        return _arrResults
    }
    
    , getMonitorItems: function () {
        var _arrResults = []

        _arrResults = this.select("SELECT items.item_id, items.display_name, items.descr \
                  , items.display_format, items.unit, units.display_symbol \
                  FROM monitor_items items \
                  LEFT OUTER JOIN units units ON items.unit = units.name \
                  ORDER BY items.display_name asc")

        return _arrResults
    }
};
