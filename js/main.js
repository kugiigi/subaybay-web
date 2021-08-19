//~ $(function() {
$(document).ready(function(){
    $('.datepicker').datepicker();
    App.init();
});

var App = {
    constants: {
        CRITERIA_BUTTON: "#criteria_button"
        , DEMO_CHECKBOX: "#demo_checkbox"
        , CORS_CHECKBOX: "#cors_checkbox"
        , HEADER_ROW: ".persona-header .mdl-layout__header-row"
        , CORS_PROXY: "https://api.codetabs.com/v1/proxy?quest="
        , PROFILES_LIST: ".mdl-layout__drawer .mdl-navigation"
        , PROFILE_TITLE: ".persona-header .persona-title.mdl-layout-title"
        , PROFILE_ACTIVE: ".mdl-layout__drawer .mdl-navigation .mdl-navigation__link.active"
        , VALUES_LIST: ".mdl-layout__content .list-view ul"
        , LIST_CONTAINER: "#container"
        , DATABASE_URL: "#database_url"
        , DEMO_URL: "https://github.com/kugiigi/subaybay-web/raw/main/demo/8df23b9827c6d1d8e6f53ae822fa4f0a.sqlite"
    },
    init: function() {
        // For testing only
        //~ this.clearLocalStorage();

        // Set default local storage values
        if (localStorage.getItem("activeProfile") === null) {
            localStorage.activeProfile = 1;
        }

        if (localStorage.getItem("demoMode") === null) {
            localStorage.demoMode = true;
        }

        if (localStorage.getItem("corsEnabled") === null) {
            localStorage.corsEnabled = true;
        }

        // Restore local storage values
        if (localStorage.getItem("corsEnabled") === "true") {
            App.setCors(false);
        }

        if (localStorage.getItem("demoMode") === "true") {
            App.setDemoMode(false);
        }
        
        if (localStorage.databaseUrl) { 
            $(App.constants.DATABASE_URL).val(localStorage.databaseUrl)
        }
        
        // Check Qurrery Strings
        let queryDBUrl = Functions.getQueryParams("dbsource", document.location);
        let queryDemo = Functions.getQueryParams("demo", document.location);
        let queryCors = Functions.getQueryParams("cors", document.location);
        
        if (queryDemo) {
            switch (queryDemo) {
               case "Y":
                    App.setDemoMode(true);
                    break;
               case "N":
                    App.setDemoMode(false);
                    break;
            }
        }

        if (queryCors) {
            switch (queryCors) {
               case "Y":
                    App.setCors(true);
                    break;
               case "N":
                    App.setCors(false);
                    break;
            }
        }

        if (queryDBUrl) {
            $(App.constants.DATABASE_URL).val(queryDBUrl)
            localStorage.databaseUrl = queryDBUrl;
        }
        

        // Setup Sql Database
        this.setupDBObserver();
        this.updateData();
        
        // Setup observer for the date in the list page
        this.listPage.setupDateObserver()

        // Set list page to today
        this.listPage.setDate(moment().format())
    },
    setupDBObserver: function() {
        var elementName = "database"
        var targetNode = document.querySelector("body");
        
        if(targetNode){
            var observer = new MutationObserver(function(mutationsList, observer) {
                for(const mutation of mutationsList) {
                    if (mutation.type === "attributes" && mutation.attributeName === "db-ready") {
                        App.listProfiles();
                        App.listPage.listValues()
                    }
                }
            });
            var config = { attributes: true };
            observer.observe(targetNode, config);
        }
    },
    updateData: function() {
        App.listPage.reset();

        let _dbUrl = "";
        let _dbUserUrl = $(App.constants.DATABASE_URL).val();
        let _demoMode = App.demoMode()
        if (_demoMode) {
            _dbUrl = App.constants.DEMO_URL;
        } else {
            _dbUrl = _dbUserUrl;
        }
        
        if (_dbUserUrl == "" && !_demoMode) {
            this.setDBError("<-- Set database source");
        } else {
            this.initSql(_dbUrl, App.corsEnabled())
        }
    },
    initSql: async function(__databaseUrl, __corsEnabled) {
        try {
            // Reset db object
            Database.db = null;

            let _dbUrl = "";
            if (__corsEnabled) {
                _dbUrl = this.corsProxyURL(__databaseUrl);
            } else {
                _dbUrl = __databaseUrl;
            }

            const sqlPromise = initSqlJs();
            const dataPromise = fetch(_dbUrl).then(res => res.arrayBuffer());
            const [SQL, buf] = await Promise.all([sqlPromise, dataPromise])
            Database.db = new SQL.Database(new Uint8Array(buf));

            // Tags the document to signal that the database is ready
            $("body").attr("db-ready","");
        } catch (e) {
            this.setDBError("Error loading database");
        }
    },
    setDBError: function(__errorTitle) {
        // Tags the document to signal that the database is ready
        $("body").attr("db-error","");
        $(App.constants.LIST_CONTAINER).attr("data-error","");
        this.setProfileName(__errorTitle);
    },
    clearLocalStorage: function() {
        localStorage.clear();
    },
    corsProxyURL: function(__origUrl) {
        return App.constants.CORS_PROXY + __origUrl
    },
    setCors: function(__newValue) {
        $(App.constants.CORS_CHECKBOX).prop("checked", __newValue);
        this.toggleCors();
    },
    toggleCors: function() {
        var checked = $(App.constants.CORS_CHECKBOX).is(":checked")
        localStorage.corsEnabled = checked;
    },
    corsEnabled: function() {
        return $(App.constants.CORS_CHECKBOX).is(":checked")
    },
    setDemoMode: function(__newValue) {
        $(App.constants.DEMO_CHECKBOX).prop("checked", __newValue);
        this.toggleDemo();
    },
    toggleDemo: function() {
        var checked = $(App.constants.DEMO_CHECKBOX).is(":checked")
        localStorage.demoMode = checked;

        if (checked) {
            $(App.constants.HEADER_ROW).addClass("demo-mode");
        } else {
            $(App.constants.HEADER_ROW).removeClass("demo-mode");
        }
    },
    demoMode: function() {
        return $(App.constants.DEMO_CHECKBOX).is(":checked")
    },
    listProfiles: function() {
        // Clear profiles
        $(App.constants.PROFILES_LIST).empty();

        let _profilesList = DataUtils.profiles.list();

        let _activeProfileExists = false;

        for (let i = 0; i < _profilesList.length; i++) {
            let _activeAttr = "";
            let _profileId = _profilesList[i].profile_id;
            let _displayName = _profilesList[i].display_name;

            if (localStorage.activeProfile == _profileId) {
                _activeAttr = " active";
                this.setProfileName(_displayName);
                _activeProfileExists = true;
            }

            let _htmlCode = "<a class='mdl-navigation__link" + _activeAttr + "' data-id='" + _profileId + "'  data-name='" + _displayName 
                        + "' onclick='App.selectProfile(this);'>" + _displayName + "<i class='material-icons'>check</i></a>";
            $(App.constants.PROFILES_LIST).append(_htmlCode);
        }

        if (!_activeProfileExists) {
            this.setProfileName("<-- Select a profile");
        }
    },
    selectProfile: function(__obj) {
        localStorage.activeProfile = $(__obj).attr("data-id");

        this.setProfileName($(__obj).attr("data-name"));

        // Remove active class from current active
        $(App.constants.PROFILE_ACTIVE).removeClass("active");

        // Set active class to new current active
        $(__obj).addClass("active")

        // Update data
        if (Database.db) {
            App.listPage.listValues()
        }
    },
    setProfileName: function(__profileName) {
        $(App.constants.PROFILE_TITLE).text(__profileName);
    },
    setDatabaseUrl: function (__dbUrl) {
        localStorage.databaseUrl = __dbUrl;
    },
    listPage: {
        setupDateObserver: function() {
            var elementName = "date"
            var targetNode = document.querySelector(App.constants.CRITERIA_BUTTON);
            
            if(targetNode){
                var observer = new MutationObserver(function(mutationsList, observer) {
                    for(const mutation of mutationsList) {
                        if (mutation.type === "attributes") {
                            switch(mutation.attributeName) {
                                case "data-date": 
                                    //~ console.log(mutation)
                                    App.listPage.setDateLabel(new Date(mutation.target.dataset.date))
                                    if (Database.db) {
                                        App.listPage.listValues()
                                    }
                                    break;
                                case "value":
                                    let _dateValue = moment(mutation.target.value, "MMM DD, YYYY").format()

                                    $(App.constants.CRITERIA_BUTTON).attr("data-date", _dateValue)
                                    break;
                            }
                        }
                    }
                });
                var config = { attributes: true };
                observer.observe(targetNode, config);
            }
        },
        reset: function() {
            // Reset container
            $(App.constants.LIST_CONTAINER).removeAttr("data-ready")
            $(App.constants.LIST_CONTAINER).removeAttr("data-error")
            $(App.constants.LIST_CONTAINER).removeAttr("no-data")

            // Clear list
            $(App.constants.VALUES_LIST).empty();
        },
        getDate: function() {
            return $(App.constants.CRITERIA_BUTTON).attr("data-date")
        },
        setDate: function(__petsa) {
            $(App.constants.CRITERIA_BUTTON).attr("data-date", __petsa)
            
            // Set date in the date picker
            $(App.constants.CRITERIA_BUTTON).datepicker('setDate', new Date(__petsa));
        },
        setDateLabel: function(__petsa) {
            var formattedDate = Functions.relativeDate(__petsa,"ddd, MMM DD", "Basic")

            return $(App.constants.CRITERIA_BUTTON).text(formattedDate);
        },
        nextDay: function() {
            var currentDay = $(App.constants.CRITERIA_BUTTON).attr("data-date")
            var nextDay = Functions.addDays(new Date(currentDay), 1)
            App.listPage.setDate(nextDay)
        },
        previousDay: function() {
            var currentDay = $(App.constants.CRITERIA_BUTTON).attr("data-date")
            var prevDay = Functions.subtractDays(new Date(currentDay), 1)
            App.listPage.setDate(prevDay)
        },
        listValues: function() {
            App.listPage.reset();
            // Reset container
            //~ $(App.constants.LIST_CONTAINER).removeAttr("data-ready")
            //~ $(App.constants.LIST_CONTAINER).removeAttr("no-data")
        
            let  _valuesListObj = $(App.constants.VALUES_LIST);
            //~ // Clear list
            //~ _valuesListObj.empty();

            let _fromDate = Functions.formatDateCriteria(App.listPage.getDate())
            let _toDate = Functions.formatDateCriteria(App.listPage.getDate())
            let _resultsObj = DataUtils.values(localStorage.activeProfile).itemValues("all", "day", _fromDate, _toDate);
            let _valuesList = _resultsObj.values;
            let _prevTime = ""
            let _currentTime = ""
            let _sectionHtml = ""
            let _itemName = ""
            let _value = ""
            let _unit = ""
            let _comments = ""

            for (let i = 0; i < _valuesList.length; i++) {
                //~ console.log(_valuesList[i])
                _currentTime = _valuesList[i].entryDate;
                _itemName = _valuesList[i].itemName;
                _value = _valuesList[i].values;
                _unit = _valuesList[i].unit;
                _comments = _valuesList[i].comments;

                if (_prevTime !== _currentTime) {
                    _sectionHtml = "<li class='list-section'><span class='left date-label'>" + _currentTime + "</span></li>"
                    _valuesListObj.append(_sectionHtml);
                }

                let _htmlCode = "<li class=item'>"
                                    + "<span class='left item-label'>" + _itemName + "</span>"
                                    + "<span class='right'>"
                                        + "<div class='value'>"
                                            + "<span class='value value-label'>" + _value + "</span>"
                                            + "<span class='unit unit-label'>" + _unit + "</span>"
                                        + "</div>"
                                        + "<div class='comments comments-label'>" + _comments + "</div>"
                                    + "</span>"
                                + "</li>"
                ;
                _valuesListObj.append(_htmlCode);

                _prevTime = _currentTime;
            }
            
            // Set main container attributes as basis when data is ready
            $(App.constants.LIST_CONTAINER).attr("data-ready", "")
            
            if (_valuesList.length == 0) {
                $(App.constants.LIST_CONTAINER).attr("no-data", "")
            }
        },
    }
};


var container = $('#container');

//~ $(document).on('click', '.list-view li', function(){
  //~ $(this).addClass('active');
  //~ container.addClass('details');
//~ });

$('.back').click(function(){
  container.removeClass('details');
  $('.list-view li').removeClass('active');
});
