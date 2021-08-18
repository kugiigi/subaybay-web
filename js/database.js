var Database = {
    db: null
    , select: function(__statement, __args) {
        let _arrResult = [];
         // Prepare a statement
        //~ const stmt = db.prepare("SELECT * FROM test WHERE col1 BETWEEN $start AND $end");
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
    
};
