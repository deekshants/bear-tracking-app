/* eslint-disable no-unused-vars */
import { LightningElement, track, wire } from 'lwc';
import { NavigationMixin, CurrentPageReference } from 'lightning/navigation';
import { fireEvent } from 'c/pubsub';
import ursusResources from "@salesforce/resourceUrl/ursus_park";
import getAllBears from "@salesforce/apex/BearController.getAllBears";
import { loadStyle } from 'lightning/platformResourceLoader';
import searchBears from "@salesforce/apex/BearController.searchBears";
export default class BearListNav extends NavigationMixin(LightningElement) {

    @track searchTerm = '';

    @track bears;
    @wire(CurrentPageReference) pageRef;
    @wire(searchBears, { searchTerm: '$searchTerm' })
    loadBears(result) {
        this.bears = result;
        if (result.data) {
            fireEvent(this.pageRef, 'bearListUpdate', result.data);
        }
    }
/*
    @track bears;
    @wire (CurrentPageReference) pageRef;
    @wire(searchBears, { searchTerm: '$searchTerm' })
    loadBears(result){
        this.bears = result;
        if(result.data){
            fireEvent(this.pageRef, 'bearListUpdate', result.data)
        }
    }
*/
    connectedCallback() {
        loadStyle(this, ursusResources + '/style.css');
    }

    handleSearchTermChange(event) {


        // long as this function is being called within a delay of 300 ms.
        // This is to avoid a very large number of Apex method calls.

        window.clearTimeout(this.delayTimeout);
        const searchTerm = event.target.value;

        // eslint-disable-next-line @lwc/lwc/no-async-operation 	 
        this.delayTimeout = setTimeout(() => {
            this.searchTerm = searchTerm;
        }, 300);
    }

    get hasResults() {
        return (this.bears.data.length > 0);
    }

    handleBearView(event) {
        // Get bear record id from bearview event

        const bearId = event.detail;

        // eslint-disable-next-line no-console
        console.log(bearId);

        // Navigate to bear record page
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: bearId,
                objectApiName: 'Bear__c',
                actionName: 'view',
            },
        });
    }

    // for getting all  bears without search
    //@wire (getAllBears) bears;

    /* Code without wire
    
    @track bears;
    @track error;
    
    connectedCallback(){
        this.loadBears();
    }

    loadBears(){
        getAllBears()
            .then(result => {
                this.bears = result;
            })
            .catch(error => {
                this.error = error;
            });
            
    } */
}