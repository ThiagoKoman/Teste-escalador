function format_2_char(n){
    let txt = `${n}`;
    if(txt.length < 2){
        return `0${txt}`
    }else{
        return txt
    }
}