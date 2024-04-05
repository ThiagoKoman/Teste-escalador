let table = document.getElementsByClassName("monthly")
let thead = document.querySelector(".monthly > thead")  
let tfoot = document.querySelector(".monthly > tfoot")  



function get_color_scale(distribuition){
    let max_value = 0
    let min_value = 1000

    for(let i = 1; i<distribuition.length; i++){
        for(let j = 0; j<distribuition[i].length; j++){
            if(distribuition[i][j] < min_value){
                min_value = distribuition[i][j]
            }
            if(distribuition[i][j] > max_value){
                max_value = distribuition[i][j]
            }
        }
    }
    let range = max_value - min_value
    return [0, parseInt((range/6)*1)+min_value, parseInt((range/6)*2)+min_value,parseInt((range/6)*3)+min_value,parseInt((range/6)*4)+min_value,parseInt((range/6)*5)+min_value,parseInt(range)+min_value]
}

function getColor(list, value){
    let lastColor = 6
    if(value == 0){
        return 0
    }
    for(let i = 0; i<list.length; i++){
        if(value>=list[i]){
            lastColor = i
        }
    }
    
    return lastColor
}

// Gera a tabela superior para horários
function createThead(){
    let results = mountDistribuition(count_days, employees)
    let color_scale = get_color_scale(results)
    thead.innerHTML = ""
    for(let i = 0; i < 24 ; i++){
        let tr = document.createElement("tr")
        let th = document.createElement("th")
        th.innerHTML = i
        th.setAttribute("colspan","2")
        tr.appendChild(th)
        for(let j = 1 ; j<=count_days ; j++){
            let td = document.createElement("td")
            td.setAttribute("day",j)
            td.setAttribute("hour",i)
            td.classList.add("cs_dist_"+getColor(color_scale,results[j][i]))
            td.innerHTML = results[j][i]
            tr.appendChild(td)
        }
        thead.append(tr)
    }
}

function mountDistribuition(){
    let distribuition = []
    for(let i = 1 ; i<=count_days; i++){
        distribuition[i] = [];
        for(let j = 0; j < 24; j++){
            distribuition[i][j] = 0
        }
    }
    for(let d = 1 ; d<=count_days; d++){
        employees.forEach(({start,rest,journey_range,dayoffs,extra_time,journey_alteration})=>{
            
            // Verifica alteração na jornada
            let day_start = start
            if(verifyDayInList(journey_alteration,d)){
                day_start = verifyDayInListAndGetHour(journey_alteration,d)
            }

            // Verifica dia de descanso
            if(!verifyDayInList(dayoffs,d)){
                for(let h = day_start; h<=day_start+journey_range; h++){

                    // Verifica hora de almoço
                    if(day_start+rest != h){
                        let hour = h
                        let day = d
                        
                        // Verifica jornada noturna
                        if(h > 23 && day < count_days){
                            hour -= 24
                            day += 1
                        }
                        distribuition[day][hour] += 1
                    }
                } 

                 // Verifica hora extra
                if(verifyDayInList(extra_time,d)){
                    const index = indexOfValueInStructure(extra_time, "day", d)
                    let h = extra_time[index].hour
                    if( h == 1){
                        let hour = day_start+journey_range+1
                        let day = d
                        if(hour > 23){
                            hour = 0
                        }
                        distribuition[day][hour] += 1
                    }else if( h == 2){
                        let hour = day_start+journey_range+1
                        let day = d
                        if(hour > 23){
                            hour = 0
                        }
                        distribuition[day][hour] += 1
                        distribuition[day][hour+1] += 1
                    }
                    
                    
                        
                    
                }
            } 
        })
    }
    return distribuition
}

function createTbody(count_days){
    let trs = document.querySelectorAll(".monthly > tbody > tr")
    const hide = trs[0]
    const sem = trs[1]
    const dia =  trs[2]

    hide.children[0].setAttribute("colspan",count_days+2)

    for(let j = 1 ; j<=count_days ; j++){
        let th = document.createElement("th")
        th.innerHTML = j
        dia.appendChild(th)

        let th2 = document.createElement("th")
        th2.innerHTML = getWeekDay(j,month,year)
        sem.appendChild(th2)
    }    
}

function getWeekDay(dia,mes,ano){
    const data = new Date(ano, mes - 1, dia);
    const diasSemana = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    const numeroDiaSemana = data.getDay();
    return diasSemana[numeroDiaSemana];
}

function createTfoot(){
    tfoot.innerHTML=""
    for(let i = 0; i < employees.length ; i++){
        employee = employees[i]

        let tr = document.createElement("tr")
        let th1 = document.createElement("th")
        th1.innerHTML = employee.name

        let th2 = document.createElement("th")
        let employee_end = employee.start + employee.journey_range

        if(employee_end > 23)
            employee_end = employee_end - 24 
        th2.innerHTML = `${employee.start}:00 - ${format_2_char(employee_end)}:20`
        tr.appendChild(th1)
        tr.appendChild(th2)

        for(let d = 1 ; d<=count_days ; d++){
            let td = document.createElement("td")
            td.setAttribute("day",d)
            td.setAttribute("employee",employee.id)
            td.setAttribute("class","can_select")
            if(verifyDayInList(employee.dayoffs,d)){
                td.innerHTML = `<span class="dayoff">F</span>`
            }else{
                if(verifyDayInList(employee.extra_time,d)){
                    hour = verifyDayInListAndGetHour(employee.extra_time,d)
                    td.innerHTML = `<span class="extra-hour">+${hour}</span>`
                }
                if(verifyDayInList(employee.journey_alteration,d)){
                    hour = verifyDayInListAndGetHour(employee.journey_alteration,d)
                    td.innerHTML = `<span class="journey-alteration">${hour}</span> ${td.innerHTML}`
                }
            }
            createUserEvents(td)
            
            tr.appendChild(td)
        }
        tfoot.append(tr)
    }
}

function createUserEvents(td){
    // Toogle folga
    td.addEventListener("click",(e)=>{     
        let day = td.getAttribute("day")
        let employee_id = td.getAttribute("employee")
        let employee_index = indexOfValueInStructure(employees, "id", employee_id)  
        if(altPressed){
            let dayoffs = employees[employee_index].dayoffs
            let dayoff_index = indexOfValueInStructure(dayoffs, "day", day)

            if(dayoff_index>=0){
                employees[employee_index]["dayoffs"].splice(dayoff_index, 1);           
            }else{
                employees[employee_index]["dayoffs"].push({
                    day: parseInt(day)
                })
            }
        }
        createThead()
        createTfoot()
    })

    // Alterar inicio da jornada
    td.addEventListener("wheel",(e)=>{
        let day = td.getAttribute("day")
        let employee_id = td.getAttribute("employee")
        let employee_index = indexOfValueInStructure(employees, "id", employee_id)
        
        let dayoffs = employees[employee_index].dayoffs
        let dayoff_index = indexOfValueInStructure(dayoffs, "day", day)
        
        if(altPressed && dayoff_index == -1){
            e.preventDefault()
            let journey_alteration = employees[employee_index].journey_alteration
            let journey_alteration_index = indexOfValueInStructure(journey_alteration, "day", day)

            if(journey_alteration_index == -1){
                journey_alteration.push({
                    day: day,
                    hour: employees[employee_index].start
                })
                journey_alteration_index = journey_alteration.length - 1
            }

            let deltaY = e.deltaY;
            if (deltaY > 0 && journey_alteration[journey_alteration_index].hour+1 < 24) {
                if(journey_alteration[journey_alteration_index].hour+1 == employees[employee_index].start){
                    journey_alteration.splice(journey_alteration_index,1)
                }else{
                    journey_alteration[journey_alteration_index].hour += 1
                }
            } else if (deltaY < 0 && journey_alteration[journey_alteration_index].hour-1 >= 0) {
                if(journey_alteration[journey_alteration_index].hour-1 == employees[employee_index].start){
                    journey_alteration.splice(journey_alteration_index,1)
                }else{
                    journey_alteration[journey_alteration_index].hour -= 1
                }
            }
        }
        createThead()
        createTfoot()
    })

    // Inserir hora extra
    td.addEventListener("contextmenu",(e)=>{
        let day = td.getAttribute("day")
        let employee_id = td.getAttribute("employee")
        let employee_index = indexOfValueInStructure(employees, "id", employee_id)
        let dayoffs = employees[employee_index].dayoffs
        let dayoff_index = indexOfValueInStructure(dayoffs, "day", day)
        if(altPressed && dayoff_index == -1){
            e.preventDefault()
            let extra_time = employees[employee_index].extra_time
            let extra_time_index = indexOfValueInStructure(extra_time, "day", day)
        
            if(extra_time_index == -1){
                extra_time.push({
                    day: day,
                    hour: 1
                })
                extra_time_index = extra_time.length - 1
            }else{
                let ext = extra_time[extra_time_index]
                if(ext.hour == 1){
                    ext.hour = 2
                }else if(ext.hour == 2){
                    extra_time.splice(extra_time_index,1)
                }
            }
        }
        createThead()
        createTfoot()
    })
}

function indexOfValueInStructure(list, key, value){
    for(let i = 0 ; i <list.length; i++){
        if(list[i][key] == value){
            return i
        }
    }
    return -1
}

function verifyDayInList(list,day){
    for(let i = 0 ; i < list.length; i++){
        if(list[i].day == day){
            return true
        }
    }
    return false
}

function verifyDayInListAndGetHour(list,day){
    for(let i = 0 ; i < list.length; i++){
        if(list[i].day == day){
            return list[i].hour
        }
    }
    return false
}

createTbody(count_days)
createThead(count_days, employees)
createTfoot(employees)

function isCtrlPressed(event) {
    return event.ctrlKey;
}
// Função de tratamento do evento de pressionar a tecla
function onKeyDown(event) {
    
}

// Função de tratamento do evento de soltar a tecla
function onKeyUp(event) {
    if (!event.ctrlKey) {
        ctrlPressed = false
    }
}

// Controle do pressionamento do CTRL
let altPressed = true

document.addEventListener("keydown", (e)=>{if (e.altKey) {altPressed = true}});
document.addEventListener("keyup", (e)=>{if (!e.altKey) {altPressed = true}});
document.addEventListener("contextmenu", (e)=>{e.preventDefault()});
const toogleTable = document.getElementById("toogle-table")
const theadSpam = document.getElementById("theadspam")
const trigger = document.getElementById("toogle-table")
let hThead = 0
toogleTable.addEventListener("click",(e)=>{
    if(thead.style.opacity == "0"){
        theadSpam.style.transition = "500ms";
        theadSpam.style.height=hThead+"px";
        setTimeout(()=>{
            thead.style.opacity = "0"
            theadSpam.style.transition = "0ms";
            theadSpam.style.height="0px";
            thead.style.display = "table-header-group"
            setTimeout(()=>{
                thead.style.opacity = "1"
                trigger.innerHTML = `<i class="fa fa-caret-up" aria-hidden="true"></i> Esconder distribuição <i class="fa fa-caret-up" aria-hidden="true"></i>`
            },10)
        },500)
    }else{
        thead.style.opacity = "0";
        setTimeout(()=>{
            theadSpam.style.transition = "0ms"
            theadSpam.style.height=thead.offsetHeight+"px"
            console.log(thead.offsetHeight)
            hThead = `${thead.offsetHeight}`
            thead.style.display = "none"
            setTimeout(()=>{
                theadSpam.style.transition = "500ms";
                theadSpam.style.height="0px";
                trigger.innerHTML = `<i class="fa fa-caret-down" aria-hidden="true"></i> Mostrar distribuição <i class="fa fa-caret-down" aria-hidden="true"></i>`
            }, 4);
        }, 500);
    }
})