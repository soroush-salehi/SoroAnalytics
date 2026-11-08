"use strict";
const $ = selector => document.querySelector(selector);
let rows=[],headers=[],filtered=[];
function parseCSV(text){
 const result=[];let row=[],field="",quoted=false;
 for(let i=0;i<text.length;i++){
  const char=text[i];
  if(char==='"'&&quoted&&text[i+1]==='"'){field+='"';i++;}
  else if(char==='"')quoted=!quoted;
  else if(char===","&&!quoted){row.push(field);field="";}
  else if((char==="\n"||char==="\r")&&!quoted){if(char==="\r"&&text[i+1]==="\n")i++;row.push(field);if(row.some(cell=>cell.trim()))result.push(row);row=[];field="";}
  else field+=char;
 }
 row.push(field);if(row.some(cell=>cell.trim()))result.push(row);
 if(quoted)throw new Error("The CSV file contains an unfinished quoted field.");
 return result;
}
function escapeHTML(value){return String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));}
function renderTable(){
 const host=$("#table");host.replaceChildren();
 const table=document.createElement("table"),thead=document.createElement("thead"),headRow=document.createElement("tr");
 headers.forEach(value=>{const th=document.createElement("th");th.textContent=value;headRow.append(th);});
 thead.append(headRow);table.append(thead);
 const tbody=document.createElement("tbody");
 filtered.slice(0,100).forEach(row=>{const tr=document.createElement("tr");headers.forEach((_,index)=>{const td=document.createElement("td");td.textContent=row[index]??"";tr.append(td);});tbody.append(tr);});
 table.append(tbody);host.append(table);
 $("#stats").textContent=filtered.length+" rows · "+headers.length+" columns"+(filtered.length>100?" · showing first 100":"");
}
function numericColumns(){return headers.map((name,index)=>({name,index})).filter(({index})=>rows.some(row=>row[index]?.trim()!=="")&&rows.every(row=>row[index]?.trim()===""||Number.isFinite(Number(row[index]))));}
function drawChart(){
 const index=Number($("#col").value),canvas=$("#chart"),ctx=canvas.getContext("2d");
 ctx.clearRect(0,0,canvas.width,canvas.height);
 if(!Number.isInteger(index)||!headers[index])return;
 const values=filtered.map(row=>Number(row[index])).filter(Number.isFinite);
 if(!values.length)return;
 const max=Math.max(1,...values),min=Math.min(0,...values),step=canvas.width/values.length;
 ctx.strokeStyle="#dce4ef";ctx.beginPath();ctx.moveTo(0,canvas.height-20);ctx.lineTo(canvas.width,canvas.height-20);ctx.stroke();
 values.forEach((value,i)=>{
  const height=(value-min)/(max-min||1)*(canvas.height-50);
  ctx.fillStyle="#4779df";ctx.fillRect(i*step+2,canvas.height-25-height,Math.max(2,step-4),height);
 });
}
$("#file").addEventListener("change",async event=>{
 const file=event.target.files?.[0];if(!file)return;
 try{
  const parsed=parseCSV(await file.text());
  if(parsed.length<2)throw new Error("The CSV file has no data rows.");
  headers=parsed[0].map((value,index)=>value.trim()||"Column "+(index+1));
  rows=parsed.slice(1).map(row=>headers.map((_,index)=>row[index]??""));
  filtered=[...rows];
  const options=numericColumns();
  $("#col").replaceChildren(new Option("Select numeric column",""));
  options.forEach(({name,index})=>$("#col").add(new Option(name,String(index))));
  renderTable();drawChart();
 }catch(error){$("#stats").textContent="Could not read CSV: "+error.message;}
 event.target.value="";
});
$("#col").addEventListener("change",drawChart);
