import React from 'react';
import { fromJS } from 'immutable';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
var fieldValue;



const defaultState =  fromJS({
  fieldValue: 1
});

let state = defaultState



const OriginatingStep = () => (

  <SelectField style={{
    width: '40%',
    left: '20%',
    position: 'relative'}}
        floatingLabelText="Originating Step"
        onChange={handleChange}
        value = {state.get('fieldValue')}>
        <MenuItem value={1} primaryText="First Step" />
        <MenuItem value={2} primaryText="Other" />
      </SelectField>




);
function  handleChange(event, index, value){
  state.set('fieldValue', value);
}

export default OriginatingStep;
