import React, { Component } from 'react';
import { connect } from 'react-redux';

import globalStyles from '../../styles';

import { fetchWorkflowItems, setCurrentStep, showWorkflowDialog, storeWorkflowComment, storeWorkflowCurrency, storeWorkflowAmount, storeWorkflowAmountType, storeWorkflowName, createWorkflowItem, editWorkflowItem, storeWorkflowTxid, showWorkflowDetails, updateWorkflowSortOnState, enableWorkflowSort, storeWorkflowType, postWorkflowSort, enableSubProjectBudgetEdit, storeSubProjectAmount, postSubProjectEdit, isWorkflowApprovalRequired, fetchAllSubprojectDetails, onWorkflowDialogCancel, storeWorkflowStatus } from './actions';

import { setSelectedView } from '../Navbar/actions';
import { showHistory, fetchHistoryItems } from '../Notifications/actions';
import { addDocument, clearDocuments, prefillDocuments, validateDocument } from '../Documents/actions';
import Workflow from './Workflow';
import SubProjectDetails from './SubProjectDetails'
import { getPermissions } from '../../permissions';
import { fetchRoles } from '../Login/actions';

class WorkflowContainer extends Component {
  componentWillMount() {
    const subProjectId = this.props.location.pathname.split('/')[3];
    this.props.setSelectedView(subProjectId, 'subProject');
    this.props.fetchAllSubprojectDetails(subProjectId, Date.now())
  }

  componentWillUnmount() {
    this.props.hideWorkflowDetails();
    this.props.onWorkflowDialogCancel();
  }

  render() {
    const { isAssignee, isApprover, isBank } = getPermissions(this.props.loggedInUser, this.props.subProjectDetails);
    return (
      <div>
        <div style={globalStyles.innerContainer}>
          <SubProjectDetails {...this.props} permissions={{ isAssignee, isApprover, isBank }} />
          <Workflow {...this.props} permissions={{ isAssignee, isApprover, isBank }} />
        </div>
      </div>
    )
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    fetchAllSubprojectDetails: (subprojectId, ts) => dispatch(fetchAllSubprojectDetails(subprojectId, ts)),
    fetchWorkflowItems: (streamName) => dispatch(fetchWorkflowItems(streamName)),
    openWorkflowDialog: (editMode) => dispatch(showWorkflowDialog(editMode)),
    onWorkflowDialogCancel: () => dispatch(onWorkflowDialogCancel(false)),
    storeWorkflowComment: (comment) => dispatch(storeWorkflowComment(comment)),
    storeWorkflowCurrency: (currency) => dispatch(storeWorkflowCurrency(currency)),
    storeWorkflowAmount: (amount) => dispatch(storeWorkflowAmount(amount)),
    storeWorkflowAmountType: (type) => dispatch(storeWorkflowAmountType(type)),
    storeWorkflowName: (name) => dispatch(storeWorkflowName(name)),
    storeWorkflowStatus: (state) => dispatch(storeWorkflowStatus(state)),
    storeWorkflowTxid: (txid) => dispatch(storeWorkflowTxid(txid)),
    createWorkflowItem: (stream, workflowToAdd, documents) => dispatch(createWorkflowItem(stream, workflowToAdd, documents)),
    editWorkflowItem: (stream, key, workflowToAdd, documents, previousState) => dispatch(editWorkflowItem(stream, key, workflowToAdd, documents, previousState)),
    openWorkflowDetails: (txid) => dispatch(showWorkflowDetails(true, txid)),
    hideWorkflowDetails: () => dispatch(showWorkflowDetails(false)),
    openHistory: () => dispatch(showHistory(true)),
    hideHistory: () => dispatch(showHistory(false)),
    fetchHistoryItems: (subProjectName) => dispatch(fetchHistoryItems(subProjectName)),
    setSelectedView: (id, section) => dispatch(setSelectedView(id, section)),
    setCurrentStep: (step) => dispatch(setCurrentStep(step)),
    updateWorkflowSortOnState: (items) => dispatch(updateWorkflowSortOnState(items)),
    enableWorkflowSort: () => dispatch(enableWorkflowSort(true)),
    postWorkflowSort: (streamName, workflowItems) => dispatch(postWorkflowSort(streamName, workflowItems)),
    storeWorkflowType: (value) => dispatch(storeWorkflowType(value)),
    enableBudgetEdit: () => dispatch(enableSubProjectBudgetEdit(true)),
    disableBudgetEdit: () => dispatch(enableSubProjectBudgetEdit(false)),
    storeSubProjectAmount: (amount) => dispatch(storeSubProjectAmount(amount)),
    postSubProjectEdit: (parent, streamName, status, amount) => dispatch(postSubProjectEdit(parent, streamName, status, amount)),
    addDocument: (payload, name, id) => dispatch(addDocument(payload, name, id)),
    clearDocuments: () => dispatch(clearDocuments()),
    validateDocument: (payload, hash) => dispatch(validateDocument(payload, hash)),
    prefillDocuments: (documents) => dispatch(prefillDocuments(documents)),
    fetchRoles: () => dispatch(fetchRoles()),
    isWorkflowApprovalRequired: (approvalRequired) => dispatch(isWorkflowApprovalRequired(approvalRequired)),
  };
}

const mapStateToProps = (state) => {
  return {
    workflowItems: state.getIn(['workflow', 'workflowItems']).toJS(),
    subProjectDetails: state.getIn(['workflow', 'subProjectDetails']).toJS(),
    workflowDialogVisible: state.getIn(['workflow', 'workflowDialogVisible']),
    workflowToAdd: state.getIn(['workflow', 'workflowToAdd']).toJS(),
    workflowState: state.getIn(['workflow', 'workflowState']),
    editMode: state.getIn(['workflow', 'editMode']),
    currentStep: state.getIn(['workflow', 'currentStep']),
    users: state.getIn(['login', 'users']).toJS(),
    showWorkflowDetails: state.getIn(['workflow', 'showDetails']),
    showDetailsItemId: state.getIn(['workflow', 'showDetailsItemId']),
    showHistory: state.getIn(['notifications', 'showHistory']),
    historyItems: state.getIn(['workflow', 'historyItems']).toJS(),
    subProjects: state.getIn(['detailview', 'subProjects']),
    loggedInUser: state.getIn(['login', 'loggedInUser']).toJS(),
    workflowSortEnabled: state.getIn(['workflow', 'workflowSortEnabled']),
    budgetEditEnabled: state.getIn(['workflow', 'subProjectBudgetEditEnabled']),
    subProjectAmount: state.getIn(['workflow', 'subProjectAmount']),
    workflowDocuments: state.getIn(['documents', 'tempDocuments']).toJS(),
    validatedDocuments: state.getIn(['documents', 'validatedDocuments']).toJS(),
    roles: state.getIn(['login', 'roles']).toJS(),

  }
}

export default connect(mapStateToProps, mapDispatchToProps)(WorkflowContainer);