/* eslint-disable no-unused-vars */
import { LightningElement, api, track, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';

const fields = [
    'Bear__c.Name',
    'Bear__c.Location__Latitude__s',
    'Bear__c.Location__Longitude__s'
];

export default class BearLocation extends LightningElement {
    @track name;
    @track mapMarkers = [];
    @api recordId;
    
    @wire(getRecord, { recordId: '$recordId', fields } )
    loadBear ({error, data}) {
        if (error) {
            // TODO: Error handling
        } else if (data) {
            // TODO: Data handling (Get bear data)
            this.name = data.fields.Name.value;
            const Latitude = data.fields.Location__Latitude__s.value;
            const Longitude = data.fields.Location__Longitude__s.value;

            //Transform data into Map Markers
            this.mapMarkers = [{
                location : {Latitude, Longitude} ,
                title : this.name,
                description : `Coords : ${Latitude} , ${Longitude}`
            }];
        }
    }
    get cardTitle(){
        return (this.name) ? `${this.name}'s Location` : 'Bear Location';
    }
}