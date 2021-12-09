

$(document).ready(function () {
    $.ajaxSettings.async = false;
    $.getJSON("system_preset.json", function (data, textStatus) {
        console.log(data, textStatus);
        presetMngr.systemPresets = data;
    });
    // Load system presets
    
    // Import preset
    $("#btn-import-system-preset").click(function () {
        let selection = $("#editor-select-system-preset").children('option:selected');
        console.log(selection);
        presetMngr.add(presetMngr.systemPresets[selection.index()]);
    });
    // Export preset
    $("#btn-export-user-preset").click(function () {
        $("#txt-preset").text(JSON.stringify(CurriculaPreset.current.data));
    });
    // Create preset
    $("#btn-create-user-preset").click(function () {
        let inputJson = $("#preset-dialog .card div > div > textarea");
        let preset = new CurriculaPresetData($("#txt-preset-name").val(), {
            TJKC: inputJson[0].value,
            TYKC: inputJson[1].value,
            XGKC: inputJson[2].value
        });
        presetMngr.add(preset);
        $("#txt-preset-name").val("");
    });
    // Remove preset
    $("#btn-remove-user-preset").click(function () {
        presetMngr.remove(CurriculaPreset.current);
    });

    // Cancel
    $("#preset-dialog button.cancel").click(function () {
        $("#preset-dialog").addClass("hide");
    });
    // Confirm
    $("#preset-dialog button.confirm").click(function () {
        $("#preset-dialog").addClass("hide");
        presetMngr.saveUserPresets();
    });
    // Nav
    $("#preset-dialog div > nav > span").click(function () {
        let target = $(`#preset-dialog .card div > div > textarea:eq(${$(this).index()})`);
        target.css("display", "");
        target.siblings().css("display", "none");
    });

    //导航部分

    $("header .left ul li").click(function () {
        switch ($(this).index()) {
            case 0:
                $("#tab-preset").removeClass("hide").siblings().addClass("hide");
                break;
            case 1:
                scheduler.switchPreset(CurriculaPreset.current);
                $("#tab-schedule").removeClass("hide").siblings().addClass("hide");
                break;
            case 3:
                $("#tab-user").removeClass("hide").siblings().addClass("hide");
                break;
        }
    });

    $(".global-preset-select").hover(function () {
        $(".global-preset-select .preset-options").stop(true, true).slideDown(200);
    }, function () {
        $(".global-preset-select .preset-options").stop(true, true).slideUp(150);
    });

    //全局当前预设选择
    $(".global-preset-select .preset-options").click(function (e) {
        if (e.target.tagName == "A") {
            presetMngr.switchGlobalPresetByIndex($(e.target).index());
        }
    });


    //预设编辑

    $(".term-config select").change(function () {
        let term = $(".term-config select[data-term]")[0].selectedIndex + 1;
        $(".term-config label[data-label='term-text']").text(
            $(".term-config select[data-year]").val() + "-" + term);
        $(".term-config label[data-label='term-weeks']").text("周数：" + (term == 1 || term == 3 ? 16 : term == 2 ? 3 : 4));
    });


    // Open editor
    $("#btn-edit-preset").click(function () {
        $("#preset-dialog").removeClass("hide");
    });

    // Save preset
    $("#btn-save-preset").click(function () {
        presetMngr.saveUserPresets();
        ElementPlus.ElMessage({
            message: '预设保存成功',
            type: 'success',
            duration: 1000
        });
    });

    // Switch category
    $("#tab-preset > div > nav > span").click(function () {
        let index = $(this).index();
        //TODO 获取当前的preset
        if (index == 0) presetMngr.show(CurriculaPreset.current, CourseCategory.TJKC);
        else if (index == 1) presetMngr.show(CurriculaPreset.current, CourseCategory.TYKC);
        else if (index == 2) presetMngr.show(CurriculaPreset.current, CourseCategory.XGKC);
        $(this).attr("current", "").siblings().removeAttr("current");
    })

    // Select preset
    $("#preset-selector").change(function () {
        presetMngr.show(presetMngr.presets[$(this).children('option:selected').index()]);
    });

    presetMngr.loadUserPresets();


    //时间表
    $("#tab-schedule .nav.course-nav a").click(function () {
        scheduler.showCourseList(this.attributes["data-tab"].nodeValue);
    });


    // document.addEventListener("click", function (e) {
    //     //console.log(e);
    //     $(".popup:not(.hide)").addClass("hide");
    // });
    $(".popup").click(function (e) {
        //console.log(e);
        //e.stopPropagation ? e.stopPropagation() : e.cancelBubble = true;
    });

    $("#timetable-area .arrow-left").click(() => {
        if (scheduler.curWeek == 1) return;
        scheduler.updateTimetable(--scheduler.curWeek);
        $("#zkbzc").text(scheduler.curWeek);
    });
    $("#timetable-area .arrow-right").click(() => {
        if (scheduler.curWeek == 16) return;
        scheduler.updateTimetable(++scheduler.curWeek);
        $("#zkbzc").text(scheduler.curWeek);
    });
    //scheduler.showCourseList();
    $("#timetable-area>div>div").eq(1).click(() => {
        //从周课表切换到学期课表
        scheduler.scheduleShownMode = 1;
        $("#timetable-area>div>div>div").eq(1).css("visibility", "hidden");
        $("#timetable-area>div>div").eq(1).css("display", "none");
        $("#timetable-area>div>div").eq(2).css("display", "block");
        scheduler.updateTimetable(0);
    });
    $("#timetable-area>div>div").eq(2).click(() => {
        //从学期课表切换到周课表
        scheduler.scheduleShownMode = 0;
        scheduler.updateTimetable(scheduler.curWeek);
        $("#timetable-area>div>div>div").eq(1).css("visibility", "");
        $("#timetable-area>div>div").eq(2).css("display", "none");
        $("#timetable-area>div>div").eq(1).css("display", "block");
    });
});
