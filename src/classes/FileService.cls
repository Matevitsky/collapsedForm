public with sharing class FileService {
    public void saveFiles(List<WrapperClass> files, Id accountId) {
        if (!files.isEmpty()) {
            List<ContentVersion> contentVersions = createContentVersions(files);
            insert contentVersions;

            List<ContentDocumentLink> documentLinks = createContentDocumentLinks(contentVersions, accountId);
            insert documentLinks;
        }
    }

    private List<ContentVersion> createContentVersions(List<WrapperClass> files) {
        List<ContentVersion> contentVersions = new List<ContentVersion>();
        for (WrapperClass file : files) {
            ContentVersion contentVersion = new ContentVersion();
            contentVersion.Title = file.fileName;
            contentVersion.PathOnClient = file.fileName;
            contentVersion.VersionData = EncodingUtil.base64Decode(file.base64);
            contentVersions.add(contentVersion);
        }
        return contentVersions;
    }

    private List<ContentDocumentLink> createContentDocumentLinks(List<ContentVersion> contentVersions, Id accountId) {
        List<ContentDocumentLink> documentLinks = new List<ContentDocumentLink>();
        for (ContentVersion version : [SELECT ContentDocumentId FROM ContentVersion WHERE Id IN :contentVersions]) {
            ContentDocumentLink link = new ContentDocumentLink();
            link.ContentDocumentId = version.ContentDocumentId;
            link.LinkedEntityId = accountId;
            documentLinks.add(link);
        }
        return documentLinks;
    }


    public void deleteFiles(List<Id> fileIds) {
        if (!fileIds.isEmpty()) {
            try {
                Database.delete(fileIds);
            } catch (Exception e) {
                throw new AuraHandledException('Error deleting files: ' + e.getMessage());
            }
        }
    }

    public class WrapperClass {
        @AuraEnabled public String fileName { get; set; }
        @AuraEnabled public String base64 { get; set; }
    }
}