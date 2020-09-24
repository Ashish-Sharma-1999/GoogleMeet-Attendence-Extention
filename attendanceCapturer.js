Data={
    attPanelOpen : false,
    capturing: false,
    //particpantListOpen: false,
    participantListAvail: false,
    capturingTimer: null

}
//aria-label="Close"
AttendanceUI={
    init:function(){
        //creating differnt buttons.
        panelTogglerButton=document.createElement('BUTTON');
        document.body.appendChild(panelTogglerButton);
        panelTogglerButton.id='attBtn';
        panelTogglerButton.classList.add('attCommon');
        panelTogglerButton.textContent='A';
        this.panelTogglerButton=panelTogglerButton;
    
        panel=document.createElement('DIV');
        this.panel=panel;
        document.body.appendChild(panel);
        panel.id='attPanel';
        panel.classList.add('attCommon');
        panel.classList.add('panelHidden'); //initally panel is hidden;
        this.panel=panel;
        
        panelElementList=[   
            //object name 0,            #id 1,          #parent 2       #button #value 3
            ['inputSpace',              'inptSps',      'panel',        false,  ''],
            ['tableSpace',              'tblSps',       'panel',        false,  ''],
            ['statusSpace',             'stsSps',       'panel',        false,  'Status -'],
            ['status',                  'status',       'statusSpace',  false,  ''],
            ['buttonSpace',             'btnSps',       'panel',        false,  ''],
            ['captureAtt',              'captr',        'buttonSpace',  false,  'Capture -'],
            ['startCapturingButton',    'startAttCap',  'captureAtt',   true,   'Start'],
            ['stopCapturingButton',     'stopAttCap',   'captureAtt',   true,   'Stop'],
            ['instantCaptureButton',    'instAtt',      'captureAtt',   true,   'Instant'],
            ['copyAtt',                 'cpyAtt',       'buttonSpace',  false,  'Copy Data -'],
            ['copyButton',              'cpyBtn',       'copyAtt',      true,   'Text'],
            ['copyForExcel',            'cpyExlBtn',    'copyAtt',      true,   'Excel']
        ];
        panelElementList.forEach(elementDes => {
            [element, id, parent,button, value] = elementDes;
            this[element] = document.createElement(button?'BUTTON':'DIV');
            this[parent].appendChild(this[element]);
            this[element].id = id;
            this[element].textContent = value;
        });
    },

    viewAndHidePanel:function(){
        if(!Data.attPanelOpen){
            AttendanceUI.panel.classList.add('attPanelTransition');
            panel.classList.remove('panelHidden');
            Data.attPanelOpen=true;
        }else{
            AttendanceUI.panel.classList.remove('attPanelTransition');
            panel.classList.add('panelHidden');
            Data.attPanelOpen=false;
        }
    },

    copyDataToClipboard: function(str){
        console.log('copy data')
        textarea=document.createElement('textarea');
        document.body.appendChild(textarea)
        
        textarea.value=str;
        
        textarea.select()
        document.execCommand('copy');
        document.body.removeChild(textarea);
    },

    copyData: function(){
        absent=Attendence.absent;
        absent=Array.from(absent);
        console.log('copy data')
        textarea=document.createElement('textarea');
        document.body.appendChild(textarea)
        str=absent+'\n'; //converting absent student array to string
        str1=str.replace(/\s/g,'');
        str1=str1.replace(/CO173/g,'');
        str2=str1.replace(/,/g,' ');
        console.log(str2);
        
        str2+=+'\nno of Absent Students: '+absent.length;
        str2+='\nno of Present Students: '+(rollNoData.rollNos.length-absent.length);
        
        AttendanceUI.copyDataToClipboard(str2);
    
        //resize
        //attendenceTab.style.zoom='25%';
        //setTimeout(handel=>{attendenceTab.style.zoom='100%';},2000);
        AttendanceUI.clearTable();
    },

    getInstantAttendence: function(){
        GoogleMeetInterface.getParticipantButton();
        GoogleMeetInterface.getParticipantList();
        GoogleMeetInterface.getAttendence();
        //AttendanceUI.displayTable(Attendence.present,'Present : '+Attendence.present.size);
        
    },

    displayTable: function(data,caption){
        data=Array.from(data);
        itr=0;
        noOfCol=10;
        rows=Math.floor(data.length/noOfCol);
        str="<table class='attendenceTable'>";
        str+='<caption>'+caption+'</caption>';
        for(i=0; i<rows; i++){
            str+='<tr>';
            for(j=0; j<noOfCol; j++,itr++){
                str+='<td>'+data[itr]+'</td>';
            }
            str+='</tr>';
        }

        if(data.length%noOfCol != 0){
            str+='<tr>';
            for(; itr<data.length; itr++){
                str+='<td>'+data[itr]+'</td>';
            }
            str+='</tr>';
        }
        str+="</table>"

        this.tableSpace.innerHTML=str;
    },

    clearTable: function(){
        this.tableSpace.innerHTML='';
    },

    startCapturing: function(){
        GoogleMeetInterface.getParticipantButton();
        GoogleMeetInterface.getParticipantList();
        console.log('started capturing');
        if(Attendence.record==null)
            Attendence.initRecord();
        Data.capturingTimer=setInterval(()=>{
            time=new Date();
            entrytimestamp=time.getHours()+':'+time.getMinutes();
            console.log(entrytimestamp);
            GoogleMeetInterface.getAttendence();
            
            Attendence.record.timeStamp.push(entrytimestamp);
            Attendence.rollNoList.forEach(rollNo=>{
                rollNoAbsent=Attendence.absent.has(rollNo);
                Attendence.record[rollNo].push(rollNoAbsent);
            });
        },120000);
    },

    stopCapturing: function(){
        console.log('stopped capturing');
        clearInterval(Data.capturingTimer);
        Attendence.absent=new Set();
        Attendence.rollNoList.forEach(rollNo=>{
            absents=0;
            Attendence.record[rollNo].forEach(status=>{
                if(status)
                    absents++;
            });
            percent=(absents*100)/Attendence.record[rollNo].length;
            if(percent>=25){
                Attendence.absent.add(rollNo);
            }/*else{
                Attendence.absent.delete(rollNo);
            }*/
        });
        AttendanceUI.copyDataToClipboard(JSON.stringify(Attendence.record));
        AttendanceUI.displayTable(Attendence.absent,"Absent Students");
    } 
}


GoogleMeetInterface={
    participantButton:null,
    participantList:null,

    getParticipantButton: function(){
        console.log('getParticipant');
        if (this.participantButton!=null)
            return;
        temp=document.querySelector('[aria-label="Show everyone"]');
        if(temp==null){
            setTimeout(getPartcipantButton,100);
        }else{
            this.participantButton=temp;
            return;
        }
    },

    getParticipantList: function(){
        console.log('getParticipantList');
        if(this.participantButton==null){
            setTimeout(getParticipantList,100);
        }else{
            this.participantButton.click(); //to open the list
            //participantList
            temp=document.querySelector('[role="tabpanel"]');
            if(temp==null){
                setTimeout(getParticipantList,100);
            }else{
                this.participantList=temp;
                Data.participantListAvail=true;
                return;
            }
        }
    },

    getAttendence: function(){
        console.log('getAttendance');
        if(this.participantList==null){
            Data.participantListAvail=false;
            setTimeout(getAttendence,100);
        }else{
            participantList=this.participantList;
            
            oldScroll=participantList.scrollTop;
            
            participantList.scrollTo(0,participantList.scrollHeight-(participantList.clientHeight+50));

            timer=setTimeout((timer)=>{
                /*visibleArea=participantList.scrollHeight-participantList.scrollTop;
                if(Math.abs(visibleArea-participantList.clientHeight) > 100){
                    //end not loaded load again
                    participantList.scrollTo(0,participantList.scrollHeight-(participantList.clientHeight+50));
                }else*/{
                    participantList.style.zoom='10%';
                    //end loaded
                    clearInterval(timer);
                    setTimeout(()=>{
                        text=participantList.textContent;
                        Attendence.getAbsentFormString(text);

                        participantList.style.zoom='100%';
                        participantList.scrollTo(0,oldScroll);
                    },200);
                    
                    //restoirng previoius scroll;
                }
            },100);
        }
    }
}

Attendence={
    record : null,
    rollNoList : rollNoData.rollNos,
    rollNoExp : rollNoData.expression,
    absent : null,
    present : null,

    initRecord:function(){
        record=new Object();
        record.timeStamp=[];
        this.rollNoList.forEach(rollNo=>{
            record[rollNo]=[];
        });

        this.record=record;
    },

    getAbsentFormString: function(str){
        present=str.match(this.rollNoExp);
        present=new Set(present);
        allStudents=new Set(this.rollNoList);
        this.absent=this.difference(allStudents,present);
        this.present=present;

        AttendanceUI.displayTable(Attendence.absent,'Absent : '+Attendence.absent.size);
    },

    difference: function(set1, set2) {
        if (!set1 instanceof Set || !set2 instanceof Set) {
           console.log("give Sets");
           return null;
        }
        let newSet = new Set();
        set1.forEach(elem => newSet.add(elem));
        set2.forEach(elem => newSet.delete(elem));
        return newSet;
    }
}
AttendanceUI.init();

AttendanceUI.panelTogglerButton.addEventListener('click',AttendanceUI.viewAndHidePanel);
AttendanceUI.instantCaptureButton.addEventListener('click',AttendanceUI.getInstantAttendence);
AttendanceUI.startCapturingButton.addEventListener('click',AttendanceUI.startCapturing);
AttendanceUI.stopCapturingButton.addEventListener('click',AttendanceUI.stopCapturing);
AttendanceUI.copyButton.addEventListener('click',AttendanceUI.copyData);
