public without sharing class ContactController {
    public ContactController() {

    }
    @AuraEnabled(cacheable=true)
    public static List<Contact> GetContacts(){
        return [SELECT FirstName, LastName FROM Contact LIMIT 10];
    }

    @AuraEnabled(cacheable=true)
    public static void deleteContact(Contact con){
        try {
            delete con;
        } catch (Exception e) {
            System.debug(e);
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<contact> searchContact(){
        return [SELECT Id, FirstName, LastName, Title FROM Contact LIMIT 10];
    }
}
