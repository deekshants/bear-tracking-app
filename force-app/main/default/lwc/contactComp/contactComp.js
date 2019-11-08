/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
import { LightningElement ,api,wire,track} from 'lwc';
import GetContacts from '@salesforce/apex/ContactController.GetContacts';
import deleteContact from '@salesforce/apex/ContactController.deleteContact';
import searchContact from '@salesforce/apex/ContactController.searchContact';
export default class ContactDataTable extends LightningElement {
   /* constructor() {
        super();
        window.addEventListener("resize", function(){
            console.log('hello1');
            console.log($(window).height());
          });
      }*/
    @api recordId;
    @track showModal = false;
    @track isCreateForm = false;
    @track isEditForm = false;
    @track isEmailForm = false;
    @track modalTitle;
    @track deleteCont = false;
    @track islookupActive = false;
    @track contactRow = {};

    st = {};

    
    @wire(GetContacts)
    assignContacts ({error, data}) {
        if (error) {
            console.log('Error : '+JSON.stringify(error.body));
        } else if (data) {
            this.contactList = data;
            console.log('Data : '+JSON.stringify(data) );
        }
    }

    actions = [
        { label: 'Send Email', name: 'make_email' },
        { label: 'Edit', name: 'make_edit' },
        { label: 'Delete', name: 'make_delete' }
    ];
    @track columns = [
        { label: 'First Name', fieldName: 'FirstName', editable: true },
        { label: 'Last Name', fieldName: 'LastName', editable: true },
        { label: 'Title', fieldName: 'Title' },
        {
            type: 'action',
            typeAttributes: { rowActions: this.actions },
        },
    ];
    @track items = [
        {
            type: 'avatar',
            href: 'https://www.salesforce.com',
            label: 'Avatar Pill 1',
            src:
                'https://www.lightningdesignsystem.com/assets/images/avatar1.jpg',
            fallbackIconName: 'standard:user',
            variant: 'circle',
            alternativeText: 'User avatar',
            isLink: true,
        }
    ];
    @track contactId;
    @track error;
    @track contactList ;
    @track contactSearchList ;
    

    openModal(ev) {   
        // eslint-disable-next-line no-undef
        this.modalTitle = 'Create New Contact';
        this.showModal = true;
        this.isCreateForm = true;
        
    }
    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        let contact = JSON.parse(JSON.stringify(row));
        if(actionName === "make_edit"){
            this.showModal = true;
            this.modalTitle = 'Edit Contact';
            this.contactId = contact.contactId;
            this.isEditForm = true;
        }else if(actionName === "make_delete"){
            this.showModal = true;
            this.deleteCont = true;
            this.modalTitle = 'Delete Contact';
            this.contactRow = contact;
            //this.deleteContact(contact.contactId);
        }else if(actionName === "make_email"){
            this.modalTitle = 'Send Email';
            this.showModal = true;
            this.isEmailForm = true;
        }
    }
    async deleteContact(){
        
        let conId = this.contactRow.contactId;
        const responeData = await deleteContact( {conId : conId});     
        if(responeData){
            this.closeModal();
            this.loadData();
        }
    }
    closeModal() {    
        this.showModal = false;
        this.isCreateForm = false;
        this.isEditForm = false;
        this.isEmailForm = false;
        this.islookupActive = false;
        this.contactSearchList = [];
    }
    handleContactSuccess(){
        this.contactList = [];
        this.closeModal();
        
        this.loadData();
    }

    handleSendEmail(){

    }

    async handleSearchTermChange(eve){
        let value = eve.target.value;
        if(value !== ''){
            let responeData = JSON.parse(await searchContact( { accId: this.recordId , searchTerm: value} ));   
            if(responeData.length > 0){
                this.contactSearchList = responeData;
                this.islookupActive = true;
            }else{
                this.islookupActive = false;
            }
        }else{
            this.contactSearchList = [];
            this.islookupActive = false;
        }
    }
    selectContactPill(event){
        //let isCreateNewModal = event.currentTarget.dataset.conid;
    }

}