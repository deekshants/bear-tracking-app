public with sharing class ChartHelper {

    @AuraEnabled(cacheable=true)
    public static String getAllFieldApis(String obj, Boolean sendChildFields, String childObject){
        Map<String, Schema.SObjectType> allObjectsMap = Schema.getGlobalDescribe();
        FieldWrapper fw = new FieldWrapper();
        if (!sendChildFields) {
            Schema.DescribeSObjectResult objInstance = allObjectsMap.get(obj).getDescribe();
            Map<String, Schema.SObjectField> allFields = objInstance.fields.getMap();
            Schema.DescribeFieldResult  fieldInstance;
            for (String fieldApiName : allFields.keySet()) {
                fieldInstance = allFields.get(fieldApiName).getDescribe();
                String str = String.valueOf(fieldInstance.getType()).toLowerCase();
                if (str  == 'boolean' || str == 'combobox' || str == 'currency' || str == 'double' || 
                        str == 'integer' || str == 'long' || str == 'multipicklist' || str == 'percent' || str == 'picklist') {
                    fw.dataFields.add('{"label":"'+fieldInstance.getLabel()+'","value":"'+fieldInstance.getName()+'"}');
                }
            }
        }
        else {
            Schema.DescribeSObjectResult objInstance = allObjectsMap.get(childObject).getDescribe();
            Map<String, Schema.SObjectField> allFields = objInstance.fields.getMap();
            Schema.DescribeFieldResult  fieldInstance;
            for (String fieldApiName : allFields.keySet()) {
                fieldInstance = allFields.get(fieldApiName).getDescribe();
                String str = String.valueOf(fieldInstance.getType()).toLowerCase();
                if (str == 'currency' || str == 'double' || str == 'integer' || str == 'long' || str == 'percent') {
                    fw.dataFields.add('{"label":"'+fieldInstance.getLabel()+'","value":"'+fieldInstance.getName()+'"}');
                }
            }
        }
        return JSON.serialize(fw);
    }

    @AuraEnabled(cacheable=true)
    public static string getIdentifierFields(String obj){
        List<ComboboxOptions> identifierDropdown = new List<ComboboxOptions>();
        Map<String, Schema.SObjectField> identifierFields = Schema.getGlobalDescribe().get(obj).getDescribe().fields.getMap();
        Schema.DescribeFieldResult fieldInstance;
        for(String fieldApiName : identifierFields.keySet()){
                fieldInstance = identifierFields.get(fieldApiName).getDescribe();
                String str = String.valueOf(fieldInstance.getType()).toLowerCase();
                if (str == 'string' || str == 'email' || str == 'id' || str == 'url') {
                    ComboboxOptions cmb = new ComboboxOptions();
                    cmb.value = fieldInstance.getName();
                    cmb.label = fieldInstance.getLabel();
                    identifierDropdown.add(cmb);
                }
            }
        return JSON.serialize(identifierDropdown);
    }

    @AuraEnabled(cacheable=true)
    public static String getRelatedObejcts(String obj){
        List<Schema.ChildRelationship> allChildObjects = Schema.getGlobalDescribe().get(obj).getDescribe().getChildRelationships();
        List<ComboboxOptions> objectDropdown = new List<ComboboxOptions>();
        for (Schema.ChildRelationship cr : allChildObjects) {
            if (cr.getRelationshipName() != null && cr.getChildSObject().getDescribe().isQueryable()) {
                ComboboxOptions cmb = new ComboboxOptions();
                cmb.value = cr.getChildSObject().getDescribe().getName() +';'+cr.getField().getDescribe().getName();
                cmb.label = cr.getChildSObject().getDescribe().getLabel();
                objectDropdown.add(cmb);
            }
        }
        return JSON.serialize(objectDropdown);
    }

    @AuraEnabled(cacheable=true)
    public static String getRecordData(String obj, String field, String identifierField, String duration, Boolean isChildQuery,
                                         String childObj, String refField, Boolean isChildFieldQuery, String childFieldValue, String aggrFunc){
        BarChartData bcd = new BarChartData();
        if (!isChildQuery) {
            Schema.DescribeSObjectResult objInstance = Schema.getGlobalDescribe().get(obj).getDescribe();
            Schema.DescribeFieldResult fieldInstance = objInstance.fields.getMap().get(field).getDescribe();
            String fieldType = String.valueOf(fieldInstance.getType()).toLowerCase();
            bcd.fieldLabel = fieldInstance.getLabel();
            if (fieldType == 'currency' || fieldType == 'double' || fieldType == 'integer' || fieldType == 'long'|| fieldType == 'percent') {
                bcd.chartType = 'bar';
                String query = 'SELECT '+field+' , '+identifierField+' FROM '+obj+' WHERE CreatedDate = '+duration;
                for (sObject sobj: Database.query(query)) {
                    if (sobj.get(field) != null) {
                        bcd.data.add(Double.valueOf(sobj.get(field)));
                    }
                    else {
                        bcd.data.add(0);
                    }
                    if (sobj.get(identifierField) != null) {
                        bcd.label.add(String.valueOf(sobj.get(identifierField)));
                    }
                    else {
                        bcd.label.add('--');
                    }
                    
                }
            }
            else if(fieldType == 'combobox' || fieldType == 'multiPicklist' || fieldType == 'picklist'){
                bcd.chartType = 'pie';
                for(Schema.PicklistEntry p: fieldInstance.getPicklistValues()){
                    String query = 'SELECT COUNT() FROM '+obj+' WHERE '+field+' = \''+p.getValue()+'\'';
                    bcd.data.add(Database.countQuery(query));
                    bcd.label.add(p.getLabel());
                }
            }
            else if(fieldType == 'boolean'){
                bcd.chartType = 'pie';
                String trueQuery = 'SELECT COUNT() FROM '+obj+' WHERE '+field+' = TRUE';
                bcd.data.add(Database.countQuery(trueQuery));
                bcd.label.add('True');
                String falseQuery = 'SELECT COUNT() FROM '+obj+' WHERE '+field+' = FALSE';
                bcd.data.add(Database.countQuery(falseQuery));
                bcd.label.add('False');
            }
        }

        else {
            if (!isChildFieldQuery){
                String query = 'SELECT '+identifierField+' FROM '+obj+' WHERE CreatedDate = '+duration;
                bcd.chartType = 'bar';
                bcd.fieldLabel = Schema.getGlobalDescribe().get(childObj).getDescribe().getLabelPlural()+' Count';
                for (SObject sobj :Database.query(query)) {
                    if (sobj.get(identifierField) != null) {
                        bcd.label.add(String.valueOf(sobj.get(identifierField)));
                    }
                    else {
                        bcd.label.add('--');
                    }

                    bcd.data.add(Database.countQuery('SELECT Count() FROM '+childObj+' WHERE '+refField+' = \''+sobj.Id+'\''));
                }
            }
            else {
                String query = 'SELECT '+identifierField+' FROM '+obj+' WHERE CreatedDate = '+duration;
                bcd.chartType = 'bar';
                if (aggrFunc == 'AVG') {
                    bcd.fieldLabel = Schema.getGlobalDescribe().get(childObj).getDescribe().getLabelPlural() +' '+Schema.getGlobalDescribe().get(childObj)
                    .getDescribe().fields.getMap().get(childFieldValue).getDescribe().getLabel()+' Average';
                }
                else {
                    bcd.fieldLabel = Schema.getGlobalDescribe().get(childObj).getDescribe().getLabelPlural() +' '+Schema.getGlobalDescribe().get(childObj)
                    .getDescribe().fields.getMap().get(childFieldValue).getDescribe().getLabel()+' Sum';
                }
                for (SObject sobj :Database.query(query)) {
                    if (sobj.get(identifierField) != null) {
                        bcd.label.add(String.valueOf(sobj.get(identifierField)));
                    }
                    else {
                        bcd.label.add('--');
                    }
                    try {
                        bcd.data.add(Double.valueOf(Database.query('SELECT '+aggrFunc+'('+childFieldValue+') FROM '
                        +childObj+' WHERE '+refField+' = \''+sobj.Id+'\'')[0].get('expr0')));
                    } catch (Exception e) {
                        System.debug(e.getMessage()) ;
                        bcd.data.add(0);
                    }
                }
            }
        }
        System.debug(JSON.serialize(bcd));
        return JSON.serialize(bcd);
    }

    public class ComboboxOptions {
        String label;
        String value;
    }

    public class BarChartData{
        String chartType;
        String fieldLabel;
        List<Double> data;
        List<String> label;
        public BarChartData(){
            data = new List<Double>();
            label = new List<String>();
        }
    }

    public class FieldWrapper{
        List<String> dataFields;
        public FieldWrapper(){
            dataFields = new List<String>();
        }
    }
}


/*
Boolean || Combobox || Currency || Double || Integer || Long || MultiPicklist || Percent || Picklist
*/

/*
string || email || url || Id
*/ 