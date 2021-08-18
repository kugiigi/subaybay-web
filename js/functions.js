var Functions = {
    addDays: function (petsa, days) {
        var momentDate = moment(petsa)
        return momentDate.add(days, 'day').format()
    },
    subtractDays: function (petsa, days) {
        var momentDate = moment(petsa)
        return momentDate.subtract(days, 'day').format()
    },
    relativeDate: function(petsa, format, mode) {
        var defaultFormat = "ddd, MMM DD"
        var formatToUse = format ? format : defaultFormat

        if(petsa !== null){
        
            var dtPetsa
            var engPetsa
            var formattedDate
        
            dtPetsa = moment(petsa)
        
            var comparisonValues = this.getDateComparisonValues(petsa)
            formattedDate = " - " + dtPetsa.format(formatToUse)

            switch(true){
                case dtPetsa.isSame(comparisonValues.today,'day'):
                    engPetsa = "Today" + formattedDate
                    break
                case dtPetsa.isSame(comparisonValues.yesterday,'day'):
                    engPetsa = "Yesterday" + formattedDate
                    break
                case dtPetsa.isSame(comparisonValues.tomorrow,'day'):
                    engPetsa = "Tomorrow" + formattedDate
                    break
                case dtPetsa.isBetween(comparisonValues.thisWeekFirstDay,comparisonValues.thisWeekLastDay,'day',[]) && mode === "Advanced":
                    engPetsa = "On " + dtPetsa.format("dddd")
                    break
                case dtPetsa.isBetween(comparisonValues.lastWeekFirstDay,comparisonValues.astWeekLastDay,'day',[]) && mode === "Advanced":
                    engPetsa = "Last Week"
                    break
                case dtPetsa.isBetween(comparisonValues.nextWeekFirstDay,comparisonValues.nextWeekLastDay,'day',[]) && mode === "Advanced":
                    engPetsa = "Next Week"
                    break
                case dtPetsa.isBetween(comparisonValues.lastMonthFirstDay,comparisonValues.lastMonthLastDay,'day',[]) && mode === "Advanced":
                    engPetsa = "Last Month"
                    break
                case dtPetsa.isBetween(comparisonValues.nextMonthFirstDay,comparisonValues.nextMonthLastDay,'day',[]) && mode === "Advanced":
                    engPetsa = "Next Month"
                    break
                case dtPetsa.isBetween(comparisonValues.thisMonthFirstDay,comparisonValues.thisMonthLastDay,'day',[]) && mode === "Advanced":
                    engPetsa = "This Month"
                    break
                case dtPetsa.isSameOrBefore(comparisonValues.lastMonthFirstDay,'day') && mode === "Advanced":
                    engPetsa = "Older"
                    break
                case dtPetsa.isSameOrAfter(comparisonValues.nextMonthLastDay,'day') && mode === "Advanced":
                    engPetsa = "In The Future"
                    break
                case dtPetsa.isSameOrBefore(comparisonValues.endOfLastYear, 'day'):
                    engPetsa = dtPetsa.format("ddd, MMM DD, YYYY")
                    break;
                default:
                    engPetsa = dtPetsa.format(formatToUse)
                    break
            }
        }
        return engPetsa
    },
    getDateComparisonValues: function () {
        var today
        var yesterday
        var tomorrow
        var lastWeekFirstDay
        var lastWeekLastDay
        var lastMonthFirstDay
        var lastMonthLastDay
        var nextWeekFirstDay
        var nextWeekLastDay
        var nextMonthFirstDay
        var nextMonthLastDay
        var thisMonthFirstDay
        var thisMonthLastDay
        var thisWeekFirstDay
        var thisWeekLastDay
        var sevenDaysago
        var endOfLastYear
        var result = []

        today = moment()
        yesterday = moment().subtract(1, 'day')
        tomorrow = moment().add(1, 'day')

            lastWeekFirstDay = moment().subtract(1, 'week').startOf('week')
            lastWeekLastDay = moment().subtract(1, 'week').endOf('week')
            lastMonthFirstDay = moment().subtract(1, 'month').startOf('month')
            lastMonthLastDay = moment().subtract(1, 'month').endOf('month')
            nextWeekFirstDay = moment().add(1, 'week').startOf('week')
            nextWeekLastDay = moment().add(1, 'week').endOf('week')
            nextMonthFirstDay = moment().add(1, 'month').startOf('month')
            nextMonthLastDay = moment().add(1, 'month').endOf('month')
            thisMonthFirstDay = moment().startOf('month')
            thisMonthLastDay = moment().endOf('month')
            thisWeekFirstDay = moment().startOf('week')
            thisWeekLastDay = moment().endOf('week')
            sevenDaysago = moment().subtract(7, 'day')
            endOfLastYear = moment().subtract(1, 'year').endOf('year')

        result = {
            today: today,
            yesterday: yesterday,
            tomorrow: tomorrow,
            lastWeekFirstDay: lastWeekFirstDay,
            lastWeekLastDay: lastWeekLastDay,
            lastMonthFirstDay: lastMonthFirstDay,
            lastMonthLastDay: lastMonthLastDay,
            nextWeekFirstDay: nextWeekFirstDay,
            nextWeekLastDay: nextWeekLastDay,
            nextMonthFirstDay: nextMonthFirstDay,
            nextMonthLastDay: nextMonthLastDay,
            thisMonthFirstDay: thisMonthFirstDay,
            thisMonthLastDay: thisMonthLastDay,
            thisWeekFirstDay: thisWeekFirstDay,
            thisWeekLastDay: thisWeekLastDay,
            sevenDaysago: sevenDaysago,
            endOfLastYear: endOfLastYear
        }

        return result;

    }
};
