public with sharing class EmailAutomationDetailsController {
    @AuraEnabled(cacheable=true)
    public static List<Email_Recipient__c> getEmailRecipients(Id emailAutomationId) {
        return [
            SELECT Id, Name, Type__c, Value__c 
            FROM Email_Recipient__c 
            WHERE Email_Automation__c = :emailAutomationId
        ];
    }
    @AuraEnabled(cacheable=true)
    public static String getImageForEmailAutomation(Id recordId) {
        try {
            // Query for the ContentDocumentLink associated with the record
            ContentDocumentLink docLink = [
                SELECT ContentDocumentId 
                FROM ContentDocumentLink 
                WHERE LinkedEntityId = :recordId 
                LIMIT 1
            ];

            // Query for the latest version of the document (the image)
            ContentVersion contentVersion = [
                SELECT Id 
                FROM ContentVersion 
                WHERE ContentDocumentId = :docLink.ContentDocumentId 
                ORDER BY VersionNumber DESC 
                LIMIT 1
            ];

            // Construct the URL for accessing the image
            String baseUrl = URL.getOrgDomainUrl().toExternalForm();
            String imageUrl = baseUrl + '/sfc/servlet.shepherd/version/download/' + contentVersion.Id;
            return imageUrl;
        } catch (Exception e) {
            System.debug('Error fetching image: ' + e.getMessage());
            return null;
        }
    }
}
