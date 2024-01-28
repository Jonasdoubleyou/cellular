import { Field, Value } from "./expressions";

export interface And<Fields> {
    type: "and";
    preds: Predicate<Fields>[];
};

export const and = <Fields>(...preds: Predicate<Fields>[]): And<Fields> => ({ type: "and", preds });

export interface Or<Fields> {
    type: "or";
    preds: Predicate<Fields>[];
};

export const or = <Fields>(...preds: Predicate<Fields>[]): Or<Fields> => ({ type: "or", preds });

export interface Eq<Fields> {
    type: "eq";
    field: Field;
    value: Value;
};

export const eq = <Fields, AField extends (keyof Fields) & Field, AValue extends Fields[AField] & Value>(field: AField, value: AValue): Eq<Fields> => ({
    type: "eq",
    field,
    value
});


export type Predicate<Fields> = And<Fields> | Or<Fields> | Eq<Fields>;

