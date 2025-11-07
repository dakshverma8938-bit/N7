// --- NAYE IMPORTS ---
import { api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { RefreshEvent } from 'lightning/refresh';
import savePanelists from '@salesforce/apex/NX_PanelistSaveController.savePanelists';

// --- AAPKE PURAANE IMPORTS ---
import findContacts from '@salesforce/apex/NX_InterviewPanelController.findContacts';
import { LightningElement, track } from 'lwc';

let rowCounter = 0;

export default class Nx_InterviewScheduler extends LightningElement {
    // --- NAYI PROPERTY ---
    @api recordId; // Yeh Job Post page ki 18-digit ID store karega

    // --- PURAANI PROPERTIES ---
    @track _panelMembers = []; 
    @track panelistOptions = [];

    // --- PURAANA GETTER (KOI CHANGE NAHI) ---
    get panelMembers() {
        if (this._panelMembers.length === 0) {
            return [];
        }
        return this._panelMembers.map((row, index) => {
            return {
                ...row,
                showAdd: index === 0,    
                showRemove: index > 0  
            };
        });
    }

    // --- PURAANE FUNCTIONS (KOI CHANGE NAHI) ---
    connectedCallback() {
        this.loadPanelistOptions();
        this.addRow();
    }

    // --- YEH FUNCTION UPDATED HAI ---
    loadPanelistOptions() {
        findContacts()
            .then((result) => {
                this.panelistOptions = result.map((contact) => ({
                    // Yeh line ab naye NX_Title__c picklist se value dikha rahi hai
                    label: `${contact.Name} (${contact.NX_Title__c || 'No Title'})`,
                    value: contact.Id
                }));
            })
            .catch((error) => {
                console.error('Error fetching contacts:', error);
                this.panelistOptions = [];
            });
    }

    get roundOptions() {
        return [
            { label: 'R1', value: 'R1' },
            { label: 'R2', value: 'R2' },
            { label: 'R3', value: 'R3' },
            { label: 'Final', value: 'Final' }
        ];
    }
    
    handleAddRow() { this.addRow(); }
    addRow() {
        rowCounter++;
        this._panelMembers = [ ...this._panelMembers, { id: rowCounter, contactId: '', round: '' } ];
    }
    handleRemoveRow(event) {
        const rowId = parseInt(event.currentTarget.dataset.id, 10);
        this._panelMembers = this._panelMembers.filter((r) => r.id !== rowId);
    }
    handleContactChange(event) {
        const rowId = parseInt(event.currentTarget.dataset.id, 10);
        this.updateRow(rowId, 'contactId', event.detail.value);
    }
    handleRoundChange(event) {
        const rowId = parseInt(event.currentTarget.dataset.id, 10);
        this.updateRow(rowId, 'round', event.detail.value);
    }
    updateRow(rowId, field, value) {
        this._panelMembers = this._panelMembers.map((row) =>
            row.id === rowId ? { ...row, [field]: value } : row
        );
    }

    // --- Save function (KOI CHANGE NAHI) ---
    handleSave() {
        const isValid = this._panelMembers.every(row => row.contactId && row.round);
        if (!isValid) {
            this.showToast('Error', 'Please fill out all rows before saving.', 'error');
            return;
        }

        savePanelists({ 
            jobPostId: this.recordId,
            panelists: this._panelMembers
        })
        .then(() => {
            this.showToast('Success', 'Panelists have been saved.', 'success');
            this.dispatchEvent(new RefreshEvent());
        })
        .catch(error => {
            this.showToast('Error Saving', error.body.message, 'error');
        });
    }

    // --- Toast function (KOI CHANGE NAHI) ---
    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        });
        this.dispatchEvent(event);
    }
}