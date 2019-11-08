/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
import { LightningElement, api, wire, track } from 'lwc';
import getAllFieldApis from "@salesforce/apex/ChartHelper.getAllFieldApis";
import getRecordData from "@salesforce/apex/ChartHelper.getRecordData";
import getRelatedObejcts from "@salesforce/apex/ChartHelper.getRelatedObejcts";
import getIdentifierFields from "@salesforce/apex/ChartHelper.getIdentifierFields";
import { loadScript } from 'lightning/platformResourceLoader';
import chart from "@salesforce/resourceUrl/chartJs";

export default class ChartsDemo extends LightningElement {

    @api objectApiName;
    @track fieldValue;
    @track recordIdentifiers;
    @track identifierValue;
    @track selectedObject;
    @track isBarChart = false;
    @track durationValue = 'THIS_YEAR';
    @track showRelatedObjects = false;
    @track showChildFields = false;
    @track childFieldValue = '';
    @track avgSumValue = 'AVG';

    
    options;
    childFieldOptions = [];
    childObj = '';
    refField = '';
    relatedObjects;
    chartData = [];
    chartLabels = [];
    fieldLabel = '';
    chartType = '';
    scales = {};
    get durationOptions(){
        return [
            {value: 'THIS_YEAR', label: 'This Year'},
            {value: 'THIS_QUARTER', label: 'This Quarter'},
            {value: 'THIS_MONTH', label: 'This Month'},
            {value: 'LAST_YEAR', label: 'Previous Year'},
            {value: 'LAST_QUARTER', label: 'Last Quarter'},
            {value: 'LAST_MONTH', label: 'Last Month'}
        ];
    }
    get avgSumOptions(){
        return [
            {value: 'AVG', label: 'Average'},
            {value: 'SUM', label: 'Sum'}
        ]
        
    }

    @wire(getIdentifierFields, {obj: '$objectApiName'})
    identifierFieldsApex ({error, data}) {
        if (error) {
            console.log(JSON.stringify(error));
        } else if (data) {
            // TODO: Data handling
            
            this.recordIdentifiers = JSON.parse(data);
            this.identifierValue = this.recordIdentifiers[0].value
        }
    } 

    @wire(getRelatedObejcts, {obj : '$objectApiName'})
    realtedObjectsFunc ({error, data}) {
        if (error) {
            console.log(JSON.stringify(error));
        } else if (data) {
            this.relatedObjects = JSON.parse(data);
            if(this.relatedObjects.length > 0){
                this.selectedObject = this.relatedObjects[0].value;
                this.childObj = String(this.selectedObject).slice(0, String(this.selectedObject).indexOf(';'));
                this.refField = String(this.selectedObject).slice(String(this.selectedObject).indexOf(';') + 1, String(this.selectedObject).length);
            }
        }
    }

    @wire(getAllFieldApis, { obj: '$objectApiName' , sendChildFields: '$showChildFields', childObject: '$childObj'})
    fieldData({ error, data }) {
        if (error) {
            console.log(JSON.stringify(error));
        } else if (data) {
            let jsonData = JSON.parse(data);
            let optionString = '[';
            for (let i = 0; i < jsonData.dataFields.length; i++){
                if (i!==0) {
                    optionString = optionString + ',';    
                }
                optionString = optionString + jsonData.dataFields[i];
            }
            optionString = optionString + ']';

            if (!this.showChildFields) {
                this.options = JSON.parse(optionString);
                this.fieldValue = this.options[1].value;
            }
            else{
                this.childFieldOptions = JSON.parse(optionString);
                if(this.childFieldOptions.length > 0){
                    this.childFieldValue = this.childFieldOptions[0].value;
                }
            }
            
        }
    }

    @wire(getRecordData, { obj: '$objectApiName', field: '$fieldValue', identifierField: '$identifierValue', duration: '$durationValue', isChildQuery: '$showRelatedObjects', childObj: '$childObj', refField: '$refField', isChildFieldQuery: '$showChildFields', childFieldValue: '$childFieldValue', aggrFunc: '$avgSumValue'})
    recordsData({ error, data }) {
        if (error) {
            console.log(JSON.stringify(error));
        } else if (data) {
            this.fillChartData(data);
        }
    }

    fillChartData(data){
        let parsedData = JSON.parse(data)
        this.chartData = parsedData.data;
        this.chartLabels = parsedData.label;
        this.fieldLabel = parsedData.fieldLabel;
        this.chartType = parsedData.chartType;
        if (parsedData.chartType === 'pie'){
            this.scales = {};
            this.isBarChart = false;
        }
        else if(parsedData.chartType === 'bar'){
            this.isBarChart = true;
            this.scales = {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            };
        }
        this.renderChart();
    }

    generateColors() {
        var bgColors = [];
        for (let i = 0; i < this.chartLabels.length; i++) {
            bgColors.push('#' + ((1 << 24) * Math.random() | 0).toString(16));
        }
        return bgColors;
    }

    renderedCallback() {
        Promise.all([
            loadScript(this, chart + '/Chart.js-2.8.0/dist/Chart.min.js')
        ]).then(() => {

        })
            .catch(error => {
                console.log('script load error : ' + error);
            });
    }
    
    handleFieldChange(event) {
        this.fieldValue = event.detail.value;
    }    
    handleDurationChange(event) {
        this.durationValue = event.detail.value;
    }
    handleIdentifierChange(event){
        this.identifierValue = event.detail.value;
    }
    showObjectsChange(event){
        this.showRelatedObjects = event.target.checked;
    }
    showChildFieldsChange(event){
        this.showChildFields = event.target.checked;
    }
    handleRelatedObjectChange(event){
        this.selectedObject = event.detail.value;
        this.childObj = String(this.selectedObject).slice(0, String(this.selectedObject).indexOf(';'));
        this.refField = String(this.selectedObject).slice(String(this.selectedObject).indexOf(';') + 1, String(this.selectedObject).length);   
    }
    handleAvgSumChange(event){
        this.avgSumValue = event.detail.value;
        
    }
    handleChildFieldChange(event){
        this.childFieldValue = event.detail.value;
    }
    renderChart() {
        var ctx = this.template.querySelector('.barChart');
        var myChart = [];
        // eslint-disable-next-line no-undef
        myChart = new Chart(ctx, {
            type: this.chartType,
            data: {
                labels: this.chartLabels,
                datasets: [
                    {
                        label: this.fieldLabel,
                        data: this.chartData,
                        backgroundColor: this.generateColors(),

                        borderColor: 'rgba(75, 192, 192, 1)',
                    }
                ]
            },
            options: {
                responsive : true,
                scales: this.scales,
                maintainAspectRatio: true
            }
        });
    }
}