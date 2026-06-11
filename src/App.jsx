import React from 'react';
import { 
    Admin, Resource, List, Datagrid, TextField, NumberField, 
    Edit, SimpleForm, TextInput, NumberInput, Create, SelectInput,
    AppBar, Layout, ReferenceInput, ReferenceField, ReferenceManyField,
    Toolbar, SaveButton, DeleteButton, usePermissions, Login,
    FunctionField
} from 'react-admin';
import { createClient } from '@supabase/supabase-js';
import russianMessages from 'ra-language-russian';
import polyglotI18nProvider from 'ra-i18n-polyglot';

import PeopleIcon from '@mui/icons-material/People';
import ClassIcon from '@mui/icons-material/Class';
import SchoolIcon from '@mui/icons-material/School';

import backgroundImage from './bg.jpg';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const customDataProvider = {
    getList: async (resource, params) => {
        let query = supabase.from(resource).select('*', { count: 'exact' });
        
        if (params.filter) {
            if (params.filter.last_name) query = query.ilike('last_name', `%${params.filter.last_name}%`);
            if (params.filter.name) query = query.ilike('name', `%${params.filter.name}%`);
            if (params.filter.code) query = query.ilike('code', `%${params.filter.code}%`);
            if (params.filter.course) query = query.eq('course', params.filter.course);
            if (params.filter.group_id) query = query.eq('group_id', params.filter.group_id);
            if (params.filter.specialty_id) query = query.eq('specialty_id', params.filter.specialty_id);
            if (params.filter.status) query = query.eq('status', params.filter.status);
        }
        
        const { data, count, error } = await query;
        if (error) throw error;
        return { data: data || [], total: count || 0 };
    },
    getOne: async (resource, params) => {
        const { data, error } = await supabase.from(resource).select('*').eq('id', params.id).single();
        if (error) throw error;
        return { data };
    },
    getMany: async (resource, params) => {
        const { data, error } = await supabase.from(resource).select('*').in('id', params.ids);
        if (error) throw error;
        return { data: data || [] };
    },
    getManyReference: async (resource, params) => {
        const { data, count, error } = await supabase.from(resource).select('*', { count: 'exact' }).eq(params.target, params.id);
        if (error) throw error;
        return { data: data || [], total: count || 0 };
    },
    update: async (resource, params) => {
        const { data, error } = await supabase.from(resource).update(params.data).eq('id', params.id).select().single();
        if (error) throw error;
        return { data };
    },
    create: async (resource, params) => {
        const { data, error } = await supabase.from(resource).insert(params.data).select().single();
        if (error) throw error;
        return { data };
    },
    delete: async (resource, params) => {
        const { data, error } = await supabase.from(resource).delete().eq('id', params.id).select().single();
        if (error) throw error;
        return { data };
    }
};

const authProvider = {
    login: ({ username, password }) => {
        if ((username === 'admin' && password === 'admin123') || (username === 'teacher' && password === 'teacher123')) {
            localStorage.setItem('auth', username);
            return Promise.resolve();
        }
        return Promise.reject(new Error('Неверный логин или пароль'));
    },
    logout: () => { localStorage.removeItem('auth'); return Promise.resolve(); },
    checkError: () => Promise.resolve(),
    checkAuth: () => localStorage.getItem('auth') ? Promise.resolve() : Promise.reject(),
    getPermissions: () => {
        const role = localStorage.getItem('auth');
        return role ? Promise.resolve(role) : Promise.reject();
    },
};

const messages = {
    ru: {
        ...russianMessages,
        resources: {
            students: {
                name: 'Студент |||| Студенты',
                fields: { 
                    id: 'ID', 
                    last_name: 'Фамилия', 
                    first_name: 'Имя', 
                    middle_name: 'Отчество', 
                    status: 'Статус', 
                    group_id: 'Учебная группа',
                    birth_date: 'Дата рождения',
                    phone: 'Телефон'
                }
            },
            groups: {
                name: 'Группа |||| Группы',
                fields: { id: 'ID', name: 'Шифр группы', course: 'Курс', specialty_id: 'Специальность' }
            },
            specialties: {
                name: 'Специальность |||| Специальности',
                fields: { id: 'ID', code: 'Код ', name: 'Наименование специальности' }
            }
        }
    }
};
const i18nProvider = polyglotI18nProvider(() => messages.ru, 'ru');

const MyAppBar = () => <AppBar title="ИС Учета Студентов — ТК им. Поташова" />;
const MyLayout = (props) => <Layout {...props} appBar={MyAppBar} />;

const CustomEditToolbar = props => {
    const { permissions } = usePermissions();
    if (permissions !== 'admin') {
        return (
            <Toolbar {...props}>
                <span style={{ color: '#666', fontSize: '14px', fontStyle: 'italic' }}>
                    Режим просмотра (Доступ ограничен)
                </span>
            </Toolbar>
        );
    }
    return (
        <Toolbar {...props} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <SaveButton alwaysEnable />
            <DeleteButton mutationMode="pessimistic" record={props.record} resource={props.resource} />
        </Toolbar>
    );
};

const MyLoginPage = () => (
    <Login style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }} />
);

//  СПЕЦИАЛЬНОСТИ 
const specialtyFilters = [
    <TextInput label="Поиск по коду " source="code" alwaysOn />,
    <TextInput label="Поиск по наименованию" source="name" alwaysOn />
];

const SpecialtyList = () => (
    <List filters={specialtyFilters} title="Направления и специальности">
        <Datagrid rowClick="edit">
            <TextField source="code" />
            <TextField source="name" />
        </Datagrid>
    </List>
);

const SpecialtyEdit = () => {
    const { permissions } = usePermissions();
    return (
        <Edit title="Просмотр специальности" mutationMode="pessimistic">
            <SimpleForm toolbar={<CustomEditToolbar />}>
                <TextInput source="code" disabled={permissions !== 'admin'} />
                <TextInput source="name" fullWidth disabled={permissions !== 'admin'} />
                <div style={{ width: '100%', marginTop: '30px' }}>
                    <h3 style={{ fontFamily: 'Roboto, sans-serif', color: '#1976d2' }}>Закрепленные учебные группы:</h3>
                    <ReferenceManyField reference="groups" target="specialty_id" label="">
                        <Datagrid rowClick="edit">
                            <TextField source="name" />
                            <NumberField source="course" />
                        </Datagrid>
                    </ReferenceManyField>
                </div>
            </SimpleForm>
        </Edit>
    );
};

const SpecialtyCreate = () => (
    <Create title="Добавление специальности"><SimpleForm><TextInput source="code" /><TextInput source="name" fullWidth /></SimpleForm></Create>
);

//  ГРУППЫ 
const groupFilters = [
    <TextInput label="Поиск по шифру" source="name" alwaysOn />,
    <SelectInput 
        label="Курс" 
        source="course" 
        choices={[
            { id: '', name: 'Все' },
            { id: 1, name: '1 курс' },
            { id: 2, name: '2 курс' },
            { id: 3, name: '3 курс' },
            { id: 4, name: '4 курс' },
        ]} 
        alwaysOn 
        sx={{ minWidth: '150px' }}
    />
];

const GroupList = () => (
    <List filters={groupFilters} title="Список учебных групп">
        <Datagrid rowClick="edit">
            <TextField source="name" />
            <NumberField source="course" />
            <ReferenceField source="specialty_id" reference="specialties" link="edit">
                <TextField source="code" />
            </ReferenceField>
        </Datagrid>
    </List>
);

const GroupEdit = () => {
    const { permissions } = usePermissions();
    return (
        <Edit title="Просмотр группы" mutationMode="pessimistic">
            <SimpleForm toolbar={<CustomEditToolbar />}>
                <TextInput source="name" disabled={permissions !== 'admin'} />
                <NumberInput source="course" disabled={permissions !== 'admin'} />
                <ReferenceInput reference="specialties" source="specialty_id">
                    <SelectInput optionText="name" fullWidth disabled={permissions !== 'admin'} label="Специальность группы" />
                </ReferenceInput>
                <div style={{ width: '100%', marginTop: '30px' }}>
                    <h3 style={{ fontFamily: 'Roboto, sans-serif', color: '#1976d2' }}>Состав группы (Студенты):</h3>
                    <ReferenceManyField reference="students" target="group_id" label="">
                        <Datagrid rowClick="edit">
                            <TextField source="last_name" />
                            <TextField source="first_name" />
                            <TextField source="status" />
                        </Datagrid>
                    </ReferenceManyField>
                </div>
            </SimpleForm>
        </Edit>
    );
};

const GroupCreate = () => (
    <Create title="Создание новой группы">
        <SimpleForm>
            <TextInput source="name" />
            <NumberInput source="course" />
            <ReferenceInput source="specialty_id" reference="specialties">
                <SelectInput optionText="name" fullWidth />
            </ReferenceInput>
        </SimpleForm>
    </Create>
);

// СТУДЕНТЫ 
const studentFilters = [ 
    <TextInput label="Поиск по фамилии" source="last_name" alwaysOn />,
    <SelectInput 
        label="Сортировка по статусу" 
        source="status" 
        choices={[
            { id: '', name: 'Все' },
            { id: 'Активен', name: 'Активные' },
            { id: 'Академ', name: 'В академе' },
            { id: 'Отчислен', name: 'Отчисленные' },
        ]} 
        alwaysOn 
        sx={{ minWidth: '230px' }} 
    />
];

const formatPhoneInput = (value) => {
    if (!value) return '';
    let digits = value.replace(/\D/g, '');
    if (digits.startsWith('7') || digits.startsWith('8')) digits = digits.slice(1);
    digits = digits.slice(0, 10);
    if (digits.length === 0) return '';
    
    let formatted = '+7 (';
    for (let i = 0; i < digits.length; i++) {
        if (i === 3) formatted += ') ';
        if (i === 6 || i === 8) formatted += '-';
        formatted += digits[i];
    }
    return formatted;
};

const parsePhoneInput = (value) => {
    let digits = value.replace(/\D/g, '');
    if (digits.startsWith('7') || digits.startsWith('8')) digits = digits.slice(1);
    return digits.slice(0, 10);
};

const validatePhone = (value) => {
    if (!value) return 'Заполните номер телефона';
    if (value.length < 10) return 'Номер должен содержать 10 цифр';
    return undefined;
};

const formatDateInput = (value) => {
    if (!value) return '';
    if (value.includes('-') && value.split('-').length === 3) {
        const [year, month, day] = value.split('-');
        return `${day}.${month}.${year}`;
    }
    let digits = value.replace(/\D/g, '').slice(0, 8);
    let formatted = '';
    for (let i = 0; i < digits.length; i++) {
        if (i === 2 || i === 4) formatted += '.';
        formatted += digits[i];
    }
    return formatted;
};

const parseDateInput = (value) => {
    const clean = value.replace(/\D/g, '').slice(0, 8);
    if (clean.length < 8) return value;
    const day = clean.slice(0, 2);
    const month = clean.slice(2, 4);
    const year = clean.slice(4, 8);
    return `${year}-${month}-${day}`;
};

const validateDate = (value) => {
    if (!value) return 'Заполните дату рождения';
    if (!value.includes('-') || value.split('-').length !== 3) return 'Введите дату полностью (ДД.ММ.ГГГГ)';
    return undefined;
};

const customExporter = (records) => {
    const headers = ['Фамилия', 'Имя', 'Отчество', 'Дата рождения', 'Телефон', 'Статус'];
    const rows = records.map(record => {
        let bdate = record.birth_date || '—';
        if (bdate.includes('-')) {
            const p = bdate.split('-');
            if (p.length === 3) bdate = `${p[2]}.${p[1]}.${p[0]}`;
        }
        
        let phoneStr = record.phone || '—';
        if (phoneStr && phoneStr.length === 10) {
            phoneStr = `+7 (${phoneStr.slice(0,3)}) ${phoneStr.slice(3,6)}-${phoneStr.slice(6,8)}-${phoneStr.slice(8,10)}`;
        }

        return [
            record.last_name || '',
            record.first_name || '',
            record.middle_name || '',
            bdate,
            phoneStr,
            record.status || ''
        ];
    });

    const csvContent = [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    // Добавление BOM (\uFEFF) гарантирует корректное чтение кириллицы в Excel
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'БД_Студенты_Экспорт.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const StudentList = () => (
    <List filters={studentFilters} title="Электронный учет студентов" exporter={customExporter}>
        <Datagrid rowClick="edit">
            <TextField source="last_name" />
            <TextField source="first_name" />
            <TextField source="middle_name" />
            <ReferenceField source="group_id" reference="groups" link="edit">
                <TextField source="name" />
            </ReferenceField>
            
            <FunctionField label="Дата рождения" render={record => {
                const val = record?.birth_date;
                if (!val) return '—';
                if (val.includes('-')) {
                    const parts = val.split('-');
                    if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
                }
                return val;
            }} />

            <FunctionField label="Телефон" render={record => {
                const val = record?.phone;
                if (!val) return '—';
                const d = val.replace(/\D/g, '');
                let tgt = d;
                if (d.length === 11 && (d.startsWith('7') || d.startsWith('8'))) tgt = d.slice(1);
                if (tgt.length === 10) return `+7 (${tgt.slice(0,3)}) ${tgt.slice(3,6)}-${tgt.slice(6,8)}-${tgt.slice(8,10)}`;
                return val;
            }} />

            <TextField source="status" />
        </Datagrid>
    </List>
);

const StudentEdit = () => {
    const { permissions } = usePermissions();
    return (
        <Edit title="Карточка студента" mutationMode="pessimistic">
            <SimpleForm toolbar={<CustomEditToolbar />}>
                <TextInput source="last_name" disabled={permissions !== 'admin'} />
                <TextInput source="first_name" disabled={permissions !== 'admin'} />
                <TextInput source="middle_name" disabled={permissions !== 'admin'} />
                <ReferenceInput reference="groups" source="group_id">
                    <SelectInput optionText="name" label="Учебная группа" disabled={permissions !== 'admin'} />
                </ReferenceInput>
                
                <TextInput 
                    source="birth_date" 
                    label="Дата рождения"
                    placeholder="ДД.ММ.ГГГГ"
                    disabled={permissions !== 'admin'} 
                    format={formatDateInput}
                    parse={parseDateInput}
                    validate={validateDate}
                    fullWidth
                />
                
                <TextInput 
                    source="phone" 
                    label="Телефон"
                    placeholder="Введите 10 цифр номера (без +7)"
                    disabled={permissions !== 'admin'} 
                    format={formatPhoneInput}
                    parse={parsePhoneInput}
                    validate={validatePhone}
                    fullWidth
                />
                
                <SelectInput source="status" disabled={permissions !== 'admin'} choices={[
                    { id: 'Активен', name: 'Активен' },
                    { id: 'Академ', name: 'Академ' },
                    { id: 'Отчислен', name: 'Отчислен' },
                ]} />
            </SimpleForm>
        </Edit>
    );
};

const StudentCreate = () => (
    <Create title="Регистрация нового студента">
        <SimpleForm>
            <TextInput source="last_name" />
            <TextInput source="first_name" />
            <TextInput source="middle_name" />
            <ReferenceInput reference="groups" source="group_id">
                <SelectInput optionText="name" />
            </ReferenceInput>
            
            <TextInput 
                source="birth_date" 
                label="Дата рождения"
                placeholder="ДД.ММ.ГГГГ"
                format={formatDateInput}
                parse={parseDateInput}
                validate={validateDate}
                fullWidth
            />
            
            <TextInput 
                source="phone" 
                label="Телефон"
                placeholder="Введите 10 цифр номера (без +7)"
                format={formatPhoneInput}
                parse={parsePhoneInput}
                validate={validatePhone}
                fullWidth
            />
            
            <SelectInput source="status" choices={[
                { id: 'Активен', name: 'Активен' },
                { id: 'Академ', name: 'Академ' },
                { id: 'Отчислен', name: 'Отчислен' },
            ]} defaultValue="Активен" />
        </SimpleForm>
    </Create>
);

const App = () => (
    <Admin 
        title="ИС Учета Студентов" 
        dataProvider={customDataProvider} 
        authProvider={authProvider} 
        i18nProvider={i18nProvider} 
        layout={MyLayout} 
        loginPage={MyLoginPage}
    >
        {permissions => [
            <Resource name="students" list={StudentList} edit={StudentEdit} create={permissions === 'admin' ? StudentCreate : null} icon={PeopleIcon} />,
            <Resource name="groups" list={GroupList} edit={GroupEdit} create={permissions === 'admin' ? GroupCreate : null} icon={ClassIcon} />,
            <Resource name="specialties" list={SpecialtyList} edit={SpecialtyEdit} create={permissions === 'admin' ? SpecialtyCreate : null} icon={SchoolIcon} />
        ]}
    </Admin>
);

export default App;