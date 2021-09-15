
const CourseCategory = Object.freeze({
    TJKC: "TJKC",
    TYKC: "TYKC",
    XGKC: "XGKC"
});

//一个更好的做法是开一个统一的列表，但不好操作？
class CurriculaPreset {
    name;
    TJKC;
    TYKC;
    XGKC;

    dataMap=new Map(); //id的映射
    //sessions=new Map(); //考虑把解析得到的每节课信息存这

    constructor(name, rest=null) {
        this.name = name;
        if (rest?.TJKC) this.TJKC=parseTJKC(rest.TJKC);
        if (rest?.TYKC) this.TYKC=parseTJKC(rest.TYKC);
        if (rest?.XGKC) this.XGKC=parseTJKC(rest.XGKC);
    }

    static #parseRawJson(jsonstr) {
        //这里需要解决一个问题，如果输入是多个json连接起来的，需要分别解析
        let json;
        try {
            json = jsonstr.split(/(?<=})\s*(?={)/).flatMap(t => JSON.parse(t)["data"]["rows"]);
        } catch (error) {
            console.error("Parse raw json error");
            return [];
        }
        console.log(json);
        return json;
    }

    //从原始数据包里生成
    static parseTJKC(json) {
        return this.#parseRawJson(json).map(t => CourseData.parseTJKC(t));
    }

    static parseTYKC(json) {
        return this.#parseRawJson(json).map(t => CourseData.parseTYKC(t));
    }

    static parseXGKC(json) {
        return this.#parseRawJson(json).map(t => CourseData.parseXGKC(t));
    }
}

class PresetManager {
    presets = [];
    curPreset = null;
    curPresetCategory = null;

    add(preset) {
        this.presets.push(preset);
        $("#editor-select-user-preset").append(`<option>${preset.name}</option>`)
        $("#preset-selector").append(`<option>${preset.name}</option>`)
        $("#editor-select-user-preset").val(preset.name);
        this.show(preset);
        $(".preset-options").html(
            this.presets.map(t => `<a>${t.name}</a>`).join("")
        )
    }

    remove(preset) {
        let index = this.presets.indexOf(preset);
        this.presets.removeAt(index);
        if (preset == this.curPreset) {
            if (this.presets.length == 0) {
                this.show(null);
            } else {
                this.show(index == this.presets.length ? this.presets[index - 1] : this.presets[index]);
            }
        }
        $(`#editor-select-user-preset > option:eq(${index})`).remove();
        $(`#preset-selector > option:eq(${index})`).remove();
        if (this.curPreset) {
            $("#editor-select-user-preset").val(this.curPreset.name);
            $("#preset-selector").val(this.curPreset.name);
        }
    }

    switchGlobalPresetByIndex(index) {
        let preset=this.presets[index];
        //涉及到的有：预设显示，预设编辑中的选择，右上角的显示，选课
        //其中选课的只在当前显示选课的时候加载
        $(".global-preset-select span:eq(1)").text(preset.name);
        if (preset!=this.curPreset) {
            this.show(preset);
        }
        //console.log("switchGlobalPreset",preset.name);
        if (!$("#tab-schedule").hasClass("hide")) {
            scheduler.switchPreset(preset);
        }
    }

    switchGlobalPreset() {

    }

    //显示预设，具体到课程类别
    //这里的 preset 是 courseData 的数组
    show(preset, category = CourseCategory.TJKC) {
        //console.log("show", preset, category);
        if (!preset) {
            this.curPreset = null;
            $("#preset-course-list > li").remove();
            return;
        }

        if (category == this.curPresetCategory && preset == this.curPreset) return;

        this.curPreset = preset;
        $("#preset-selector").val(this.curPreset.name);

        this.curPresetCategory = category;
        let subpreset = preset[category];
        //需要针对类别讨论
        $("#preset-course-list > div.list-item").remove();
        if (category != CourseCategory.XGKC) {
            $("#preset-course-list > div:not(.list-item)").before(
                `${subpreset.map(t =>
                    `<div class="list-item" data-cid="${t.cid}">
                        <div>
                            <span>${t.cid}</span>
                            <span>${t.cname}</span>
                            <span>${t.ccat}</span>
                            <span>${t.cunit}</span>
                            <span>${t.ctype}</span>
                        </div>
                        <div class="list">
                            ${t.tcList.map(u =>
                        `<div class="list-item" data-cno="${u.no}">
                                <span>${u.no}</span>
                                ${category == CourseCategory.TYKC ? `<span>${u.sportName}</span>` : ""}
                                <span>${u.teacher}</span>
                                <span>${u.teachingPlace}</span>
                            </div>`).join("")}
                            ${$("template[data-template='preset-add-class']").html()}
                        </div>
                    </div>`
                ).join("")}`
            );
        } else {
            $("#preset-course-list > div:not(.list-item)").before(
                `${subpreset.map(t =>
                    `<div class="list-item" data-cid="${t.cid}">
                        <div>
                            <span>${t.cid}</span>
                            <span>${t.cname}</span>
                            <span>${t.ccat}</span>
                            <span>${t.cunit}</span>
                            <span>${t.ctype}</span>
                            <span>${t.teacher}</span>
                            <span>${t.teachingPlace}</span>
                        </div>
                    </div>`
                ).join("")}`
            );
        }
        //点击事件
        $("#preset-course-list > div.list-item > div.list > div > button").click(function () {
            let inputData = $(this).parent();
            $(this).parent().before(
                `<div class="list-item" data-cno="${inputData.children("input[data-cno]").val()}">
                <span>${inputData.children("input[data-cno]").val()}</span>
                <span>${inputData.children("input[data-teacher]").val()}</span>
                <span>${inputData.children("input[data-place]").val()}</span>
            </div>`
            );
            //还要处理数据
        });
        $("#preset-course-list > div > button").click(function () {
            let inputData = $(this).parent();
            console.log(inputData)
            $(this).parent().before(
                `<div class="list-item" data-cid="${inputData.find("input[data-cid]").val()}">
            <div>
                <span>${inputData.find("div input[data-cid]").val()}</span>
                <span>${inputData.find("input[data-cname]").val()}</span>
                <span>${inputData.find("input[data-cunit]").val()}</span>
                <span>${inputData.find("select[data-ctype]").val()}</span>
            </div>
            <div class="list">
                <div>
                    <input data-cno placeholder="编号" style="width: 60;">
                    <input data-teacher placeholder="教师" style="width: 100;">
                    <input data-place placeholder="课程时间地点" style="width: 400;">
                    <button>增加</button>
                </div>
            </div>                    
        </div>`
            );
        });
    }

    addCourse(cdata) {

    }

    addClass() {

    }

    loadUserPresets() {
        if (localStorage.getItem("userPresets")) {
            this.presets = JSON.parse(localStorage.getItem("userPresets"));
            $("#preset-selector").html(
                this.presets.map(t => `<option>${t.name}</option>`).join("")
            );
            $("#editor-select-user-preset").html(
                this.presets.map(t => `<option>${t.name}</option>`).join("")
            );
            $(".preset-options").html(
                this.presets.map(t => `<a>${t.name}</a>`).join("")
            )
            $(".global-preset-select span:eq(1)").text(this.presets[0]?.name);
        } else {
            this.presets = [];
        }
        this.show(this.presets[0]);
    }

    saveUserPresets() {
        localStorage.setItem("userPresets", JSON.stringify(this.presets))
    }
}

var presetMngr=new PresetManager();