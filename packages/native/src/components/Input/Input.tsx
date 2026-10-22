import { TextField, type TextFieldProps } from '../../utils/TextField.js';

export interface InputProps extends TextFieldProps {
    /** Shows a button that empties the field while it has a value (calls onChangeText with "") */
    clearable?: boolean;
}

/** Text field: size, prefix/suffix, leading icon, clear button, spinner and success check; works inside Field */
export function Input(props: InputProps) {
    return <TextField {...props} />;
}
