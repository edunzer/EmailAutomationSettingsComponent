public with sharing class EmailAutomationDetailsController {
    @AuraEnabled(cacheable=true)
    public static List<Email_Recipient__c> getEmailRecipients(Id emailAutomationId) {
        return [
            SELECT Id, Name, Type__c, Value__c 
            FROM Email_Recipient__c 
            WHERE Email_Automation__c = :emailAutomationId
        ];
    }
}
