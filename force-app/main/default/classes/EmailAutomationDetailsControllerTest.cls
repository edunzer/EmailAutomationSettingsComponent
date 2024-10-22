@isTest
public class EmailAutomationDetailsControllerTest {

    @testSetup
    static void setupData() {
        // Insert test Email Automation record
        Email_Automation__c emailAutomation = new Email_Automation__c(
            Name = 'Test Automation',
            Description__c = 'Test Automation Description',
            Allow_Self_Registration__c = true,
            Allow_Self_Deregistration__c = false
        );
        insert emailAutomation;

        // Find an active System Administrator user
        Profile sysAdminProfile = [SELECT Id FROM Profile WHERE Name = 'System Administrator' LIMIT 1];
        User testUser = [SELECT Id FROM User WHERE ProfileId = :sysAdminProfile.Id AND IsActive = true LIMIT 1];

        // Insert test Email Recipients - one with User type and one with Custom type
        Email_Recipient__c recipient1 = new Email_Recipient__c(
            Email_Automation__c = emailAutomation.Id,
            Type__c = 'User',
            User__c = testUser.Id
        );
        Email_Recipient__c recipient2 = new Email_Recipient__c(
            Email_Automation__c = emailAutomation.Id,
            Type__c = 'Custom',
            Custom_Value__c = 'custom@example.com'
        );
        insert new List<Email_Recipient__c> { recipient1, recipient2 };

        // Insert ContentVersion for image testing
        ContentVersion version = new ContentVersion(
            Title = 'Test Image',
            PathOnClient = 'TestImage.png',
            VersionData = Blob.valueOf('Test Image Data')
        );
        insert version;

        // Link ContentDocument to Email Automation
        ContentDocumentLink docLink = new ContentDocumentLink(
            LinkedEntityId = emailAutomation.Id,
            ContentDocumentId = version.ContentDocumentId,
            ShareType = 'I',
            Visibility = 'AllUsers'
        );
        insert docLink;
    }

    @isTest
    static void testGetEmailRecipients() {
        // Retrieve Email Automation Id from setup
        Email_Automation__c emailAutomation = [SELECT Id FROM Email_Automation__c LIMIT 1];

        Test.startTest();
        // Invoke the method to retrieve email recipients
        List<Email_Recipient__c> recipients = EmailAutomationDetailsController.getEmailRecipients(emailAutomation.Id);
        Test.stopTest();

        // Verify the results
        System.assertEquals(2, recipients.size(), 'Expected two recipients');
        System.assertEquals('User', recipients[0].Type__c, 'First recipient type mismatch');
        System.assertEquals('Custom', recipients[1].Type__c, 'Second recipient type mismatch');
    }

    @isTest
    static void testGetImageForEmailAutomation_Success() {
        // Retrieve Email Automation Id from setup
        Email_Automation__c emailAutomation = [SELECT Id FROM Email_Automation__c LIMIT 1];

        Test.startTest();
        // Invoke the method to get image URL
        String imageUrl = EmailAutomationDetailsController.getImageForEmailAutomation(emailAutomation.Id);
        Test.stopTest();

        // Verify that the image URL is not null and properly formatted
        System.assertNotEquals(null, imageUrl, 'Image URL should not be null');
        System.assert(imageUrl.contains('/sfc/servlet.shepherd/version/download/'), 'Image URL should contain expected path');
    }

    @isTest
    static void testGetImageForEmailAutomation_NoImage() {
        // Create a new Email Automation without any image
        Email_Automation__c emailAutomationNoImage = new Email_Automation__c(
            Name = 'Automation Without Image'
        );
        insert emailAutomationNoImage;

        Test.startTest();
        // Try to get image URL for a record with no associated image
        String imageUrl = EmailAutomationDetailsController.getImageForEmailAutomation(emailAutomationNoImage.Id);
        Test.stopTest();

        // Verify that the image URL is null since no image is linked
        System.assertEquals(null, imageUrl, 'Image URL should be null when no image is linked');
    }

    @isTest
    static void testGetImageForEmailAutomation_ExceptionHandling() {
        // Pass an invalid record Id to simulate an exception
        Id invalidId = 'aInvalidId';

        Test.startTest();
        // Invoke the method and check that it handles the exception gracefully
        String imageUrl = EmailAutomationDetailsController.getImageForEmailAutomation(invalidId);
        Test.stopTest();

        // Verify that the result is null due to the exception
        System.assertEquals(null, imageUrl, 'Image URL should be null when an exception occurs');
    }
}
