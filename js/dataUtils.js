var DataUtils = DataUtils || (function (undefined) {

    return {
        profiles: (function () {

            return {
                list: function() {
                    return Database.getProfiles();
                }
                , exists: function(displayName) {
                    return Database.checkProfileIfExist(displayName);
                }
                , new: function(displayName) {
                    var newProfileId = Database.newProfile(displayName);
                    this.refresh();
                    return newProfileId;
                }
                , edit: function(profileId, displayName) {
                    Database.editProfile(profileId, displayName);
                    this.refresh();
                }
                , delete: function(profileId) {
                    var result = Database.deleteProfile(profileId);
                    if (result.success) {
                        this.refresh();
                    }
                    return result;
                }
            }
        })()
        , monitoritems: (function () {

            return {
                list: function() {
                    return Database.getMonitorItems();
                }
                , fieldsList: function() {
                    return Database.getItemsFields();
                }
                , dashList: function() {
                    var arrResults = Database.getDashItems();
                    arrResults.unshift({ item_id: "all", display_name: "All", display_format: "", unit: "", display_symbol: "", value_type: "", scope: "" })
                    return arrResults
                }
            }
        })()
        , values: function (profile) {

            return {
                add: function(entryDate, fieldId, itemId, value) {
                    return Database.addNewValue(entryDate, fieldId, profile, itemId, value);
                }
                , edit: function(entryDate, fieldId, itemId, value, comments) {
                    return Database.updateItemValue(entryDate, fieldId, profile, itemId, value)
                }
                , delete: function(entryDate, itemId) {
                    return Database.deleteValue(profile, entryDate, itemId);
                }
                , addComment: function(entryDate, comments) {
                    return Database.addNewComment(entryDate, profile, comments);
                }
                , editComment: function(entryDate, comments) {
                    return Database.editComment(entryDate, profile, comments);
                }
                , itemValues: function(itemId, scope, dateFrom, dateTo) {
                    let arrDBData = Database.getItemValues(profile, itemId, scope, dateFrom, dateTo)
                    let arrResults = []
                    let arrComputedResult = []
                    let total = 0
                    let average = 0
                    let highest = 0
                    let last = 0
                    let txtEntryDate = ""
                    let txtDisplayName = ""
                    let txtItemId = ""
                    let txtFieldId = ""
                    let intPrecision = 0
                    let intFieldSeq = 0
                    let txtSymbol = ""
                    let txtDisplayFormat = ""
                    let valueCount = 0
                    let currentEntryDate = ""
                    let prevEntryDate = ""
                    let currentItemId = ""
                    let prevItemId = ""

                    let dashItems = DataUtils.monitoritems.dashList()

                    for (var i = 0; i < arrDBData.length; i++) {
                        txtEntryDate = arrDBData[i].entry_date
                        txtDisplayName = arrDBData[i].display_name
                        txtItemId = arrDBData[i].item_id
                        txtFieldId = arrDBData[i].field_id
                        intPrecision = arrDBData[i].precision
                        intFieldSeq = arrDBData[i].field_seq
                        txtSymbol = arrDBData[i].display_symbol
                        txtDisplayFormat = arrDBData[i].display_format

                        realValue = Functions.round(arrDBData[i].value, intPrecision)
                        txtComments = arrDBData[i].comments
                        txtComments = txtComments ? txtComments : ""

                        currentEntryDate = txtEntryDate
                        currentItemId = txtItemId
                        
                        txtFormattedEntryDate = moment(txtEntryDate).format("hh:mm A")
                        realValue = Functions.round(realValue, intPrecision)
                        
                        if (currentEntryDate !== prevEntryDate || currentItemId !== prevItemId) {
                            total = total + realValue
                            valueCount += 1
                            txtFormattedValue = Functions.formatValue(txtDisplayFormat, intFieldSeq, realValue)
                            last = { entryDate: txtFormattedEntryDate, value: txtFormattedValue }
                            
                            if (highest) {
                                if (realValue > highest.value) {
                                    highest = { entryDate: txtFormattedEntryDate, value: txtFormattedValue }
                                } else if(realValue == highest.value) {
                                    highest = { entryDate: highest.entryDate + ", " + txtFormattedEntryDate, value: txtFormattedValue }
                                }
                            } else {
                                highest = { entryDate: txtFormattedEntryDate, value: txtFormattedValue }
                            }

                            arrResults.push({
                                                 entryDate: txtFormattedEntryDate
                                                 , entryDateId: txtEntryDate
                                                 , itemName: txtDisplayName
                                                 , itemId: txtItemId
                                                 , fields:  [ { fieldId: txtFieldId, value: realValue } ]
                                                 , values: txtFormattedValue
                                                 , unit: txtSymbol
                                                 , comments: txtComments
                                             })
                        } else {
                            if (currentItemId == prevItemId) {
                                currentIndex = arrResults.length - 1
                                txtDisplayFormatWithValue = arrResults[currentIndex].values
                                txtFormattedValue  = Functions.formatValue(txtDisplayFormatWithValue, intFieldSeq, realValue)

                                last = { entryDate: txtFormattedEntryDate, value: txtFormattedValue }

                                modelFields = arrResults[currentIndex].fields
                                modelFields.push( { fieldId: txtFieldId, value: realValue } )
                                arrResults[currentIndex].values = txtFormattedValue
                            }
                        }

                        prevEntryDate = currentEntryDate
                        prevItemId = currentItemId
                        arrFields = []
                    }

                    total = Functions.round(total, intPrecision)
                    average = Functions.round(total / valueCount, intPrecision)

                    if (dashItems.indexOf("total") > -1) {
                        arrComputedResult.push( { value_type: "total", value: total, unit: txtSymbol } )
                    }

                    if (dashItems.indexOf("average") > -1) {
                        arrComputedResult.push( { value_type: "average", value: average, unit: txtSymbol } )
                    }
                    
                    if (dashItems.indexOf("last") > -1) {
                        arrComputedResult.push( { value_type: "last", value: last, unit: txtSymbol } )
                    }
                    
                    if (dashItems.indexOf("highest") > -1) {
                        arrComputedResult.push( { value_type: "highest", value: highest, unit: txtSymbol } )
                    }

                    return { values: arrResults, computed: arrComputedResult };
                }
                , dashList: function() {
                    var current, datesObj, currentItems, currentItem;
                    var currentItemId, prevItemId;
                    var currentIndex;
                    var valueType, scope, dateScope, grouping;
                    var value, title, entryDate;
                    var dateFrom, dateTo, today;
                    var dashItems = monitoritems.dashList();
                    var arrResults = [];
                    var arrValues = [];
                    var arrFieldValues = [];
                    
                    today = Functions.getToday();
                    entryDate = today;

                    for (var i = 0; i < dashItems.length; i++) {
                        current = dashItems[i];
                        currentItemId = current.item_id
                        scope = current.scope
                        valueType = current.value_type
                        
                        switch(true) {
                            case scope.indexOf('daily') > -1:
                                grouping = "day";
                                break;
                            case scope.indexOf('weekly') > -1:
                                grouping = "week";
                                break;
                            case scope.indexOf('monthly') > -1:
                                grouping = "month";
                                break;
                            default:
                                grouping = "none";
                                break;
                        }

                        switch(true) {
                            case scope.indexOf('today') > -1:
                                dateScope = "today";
                                datesObj = Functions.getStartEndDate(today, 'day');
                                dateFrom = datesObj.start;
                                dateTo = datesObj.end;
                                break;
                            case scope.indexOf('week') > -1:
                                dateScope = "thisweek";
                                datesObj = Functions.getStartEndDate(today, 'week');
                                dateFrom = datesObj.start;
                                dateTo = datesObj.end;
                                break;
                            case scope.indexOf('recent') > -1:
                                dateScope = "recent";
                                if (grouping !== "none" && valueType == "average") {
                                    datesObj = Functions.getStartEndDate(today, 'recent exclude');
                                } else {
                                    datesObj = Functions.getStartEndDate(today, 'recent');
                                }

                                dateFrom = datesObj.start;
                                dateTo = datesObj.end;
                                break;
                            case scope.indexOf('all') > -1:
                                dateScope = "all";
                                datesObj = Functions.getStartEndDate(today, 'all');
                                dateFrom = datesObj.start;
                                dateTo = datesObj.end;
                                break;
                            default:
                                dateScope = "today";
                                dateFrom = today;
                                dateTo = dateFrom;
                                break;
                        }
                        
                        switch(valueType) {
                            case 'total':
                                arrValues = this.getTotal(currentItemId, dateFrom, dateTo, grouping);
                                break;
                            case 'average':
                                arrValues = this.getAverage(currentItemId, dateFrom, dateTo, grouping);
                                break;
                            case 'last':
                                arrValues = this.getLast(currentItemId, dateFrom, dateTo, grouping);
                                break;
                            case 'highest':
                                arrValues = this.getHighest(currentItemId, dateFrom, dateTo, grouping);
                                break;
                            default: 
                                arrValues = [];
                                break;
                        }

                        arrFieldValues = [];
                        for (var h = 0; h < arrValues.length; h++) {
                            entryDate = arrValues[h].entry_date;
                            arrFieldValues.push(arrValues[h].value);
                        }

                        if (entryDate && arrFieldValues.length > 0) {
                            value = arrFieldValues.join("/");
                        } else {
                            value = "";
                        }

                        title = this.getValueLabel(valueType, dateScope, grouping, entryDate);
                        currentItem = { type: valueType, title: title, value: value, unit: current.display_symbol };
                        
                        if (currentItemId !== prevItemId) {
                            if (currentItemId !== "all") {
                                current.items = [currentItem];
                            }
                            if (valueType == "last") {
                                currentItems = arrResults[0].items;
                                if (currentItems) {
                                    currentItems.push(currentItem);
                                    arrResults[0].items = currentItems;
                                } else {
                                    arrResults[0].items = [currentItem];
                                }
                            }
                            arrResults.push(current);
                        } else {
                            currentIndex = arrResults.length - 1;
                            currentItems = arrResults[currentIndex].items;
                            currentItems.push(currentItem);
                            arrResults[currentIndex].items = currentItems;

                            if (valueType == "last") {
                                arrResults[0].items = currentItems;
                            }
                        }
                        
                        prevItemId = currentItemId;
                    }

                    return arrResults;
                }
                , getTotal: function(itemId, dateFrom, dateTo, grouping) {
                    return Database.getTotalFromValues(profile, itemId, dateFrom, dateTo, grouping)
                }
                , getAverage: function(itemId, dateFrom, dateTo, grouping) {
                    return Database.getAverageFromValues(profile, itemId, dateFrom, dateTo, grouping)
                }
                , getLast: function(itemId, dateFrom, dateTo, grouping) {
                    return Database.getLastValue(profile, itemId, dateFrom, dateTo, grouping)
                }
                , getHighest: function(itemId, dateFrom, dateTo, grouping) {
                    return Database.getHighestValue(profile, itemId, dateFrom, dateTo, grouping)
                }
                , getValueLabel: function(valueType, dateScope, grouping, entryDate) {
                    var label = "";

                    switch(valueType) {
                        case "total":
                            if (dateScope == "today") {
                                label = i18n.tr("Today's Total")
                            } else if (dateScope == "thisweek") {
                                label = i18n.tr("This week's Total")
                            } else if (dateScope == "recent") {
                                label = i18n.tr("Recent Total")
                            }
                            break;
                        case "average":
                            if (dateScope == "today") {
                                label = i18n.tr("Today's Average")
                            } else if (dateScope == "thisweek") {
                                label = i18n.tr("This Week's Average")
                            } else if (dateScope == "recent") {
                                if (grouping == "day") {
                                    label = i18n.tr("Recent Daily Average")
                                } else {
                                    label = i18n.tr("Recent Average")
                                }
                            }
                            break;
                        case "last":
                            label = Functions.relativeTime(entryDate)
                            break;
                        case "highest":
                            if (dateScope == "today") {
                                label = i18n.tr("Highest Today")
                            } else if (dateScope == "thisweek") {
                                label = i18n.tr("Highest This Week")
                            } else if (dateScope == "recent") {
                                label = i18n.tr("Highest Recently")
                            }
                            break;
                    }

                    return label;
                }
            }
        }
    }
})();
