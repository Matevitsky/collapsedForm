public with sharing class AccountController {
    private static final FileService fileService = new FileService();

    @AuraEnabled
    public static Account getAccount(Id accountId) {
        return [
                SELECT Registration_No_Of_Company__c,
                        Bank_Name__c,
                        Bank_Country__c,
                        Bank_Address__c,
                        Routing_Number__c,
                        AccountNumber,
                        Swift_Code__c,
                        Iban__c,
                        Currency__c
                FROM Account
                WHERE Id = :accountId
                LIMIT 1
        ];
    }

    @AuraEnabled
    public static Id saveAccountWithFiles(Account account, List<FileService.WrapperClass> filesToStore, List<String> filesToDelete) {
        Savepoint sp = Database.setSavepoint();
        try {
            update account;
            fileService.saveFiles(filesToStore, account.Id);
            fileService.deleteFiles(filesToDelete);
            return account.Id;
        } catch (Exception e) {
            Database.rollback(sp);
            throw new AuraHandledException(e.getMessage());
        }
    }

}