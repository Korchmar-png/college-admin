import React from 'react';
import MyLoginPage from './MyLoginPage';
import { 
  Admin, 
  Resource, 
  List, 
  Datagrid, 
  TextField, 
  DateField, 
  NumberField,
  ReferenceField,
  EditButton,
  Filter,
  TextInput,
  ReferenceInput,
  SelectInput,
  NumberInput,
  DateInput,
  SimpleForm,
  Edit,
  Create,
  required,
  AppBar,
  Layout,
  UserMenu,
  Logout
} from 'react-admin';
import { supabaseDataProvider } from 'ra-supabase';
import { createClient } from '@supabase/supabase-js';
import russianMessages from 'ra-language-russian';
import polyglotI18nProvider from 'ra-i18n-polyglot';
import { IMaskInput } from 'react-imask';


import GroupIcon from '@mui/icons-material/Group';
import SchoolIcon from '@mui/icons-material/School';
import ClassIcon from '@mui/icons-material/Class';
import PersonIcon from '@mui/icons-material/Person';
import GradeIcon from '@mui/icons-material/Grade';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';


const i18nProvider = polyglotI18nProvider(() => russianMessages, 'ru');

// Инициализация Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

const dataProvider = supabaseDataProvider({
    instanceUrl: supabaseUrl,
    apiKey: supabaseAnonKey,
    supabaseClient: supabaseClient
}, {
  mappings: {
    students: 'students',
    groups: 'groups',
    specialties: 'specialties',
    teachers: 'teachers',
    subjects: 'subjects',
    grades: 'grades',
    attendance: 'attendance',
  },
  idColumn: 'id',
});


const authProvider = {
    login: ({ username, password }) => {
        if (username === 'admin' && password === 'admin123') {
            localStorage.setItem('authenticated', 'true');
            return Promise.resolve();
        }
        return Promise.reject(new Error('Неверный логин или пароль'));
    },
    logout: () => {
        localStorage.removeItem('authenticated');
        sessionStorage.clear();
        return Promise.resolve();
    },
    checkAuth: () => {
        return localStorage.getItem('authenticated') === 'true'
            ? Promise.resolve()
            : Promise.reject();
    },
    checkError: (error) => {
        const status = error.status;
        if (status === 401 || status === 403) {
            localStorage.removeItem('authenticated');
            return Promise.reject();
        }
        return Promise.resolve();
    },
    getPermissions: () => Promise.resolve(),
    
    getIdentity: () => {
        return localStorage.getItem('authenticated') === 'true'
            ? Promise.resolve({ id: 'admin', fullName: 'admin' })
            : Promise.reject();
    }
};




const MyLogoutButton = React.forwardRef((props, ref) => (
  <Logout {...props} ref={ref} icon={<ExitToAppIcon />} label="Выйти" />
));

const MyUserMenu = () => (
  <UserMenu>
    <MyLogoutButton />
  </UserMenu>
);

const MyAppBar = (props) => (
    <AppBar {...props} userMenu={<MyUserMenu />} title="Электронный учет студентов" />
);

const MyLayout = (props) => <Layout {...props} appBar={MyAppBar} />;


const MaskedDateInput = ({ onChange, value, ...props }) => {
  return (
    <TextInput
      {...props}
      defaultValue={value}
      InputProps={{
        inputComponent: React.forwardRef(function MaskedInput(inputProps, ref) {
          return (
            <IMaskInput
              {...inputProps}
              inputRef={ref}
              mask="00.00.0000" 
              lazy={false}
              overwrite
                            onAccept={(val) => {
                const clean = val.replace(/_/g, '');
                if (clean.length === 10) {
                  const [day, month, year] = clean.split('.');
                  if (inputProps.onChange) {
                    inputProps.onChange({ target: { name: inputProps.name, value: `${year}-${month}-${day}` } });
                  }
                } else if (clean.length === 0 && inputProps.onChange) {
                  
                  inputProps.onChange({ target: { name: inputProps.name, value: undefined } });
                }
              }}
            />
          );
        }),
      }}
    />
  );
};


const StudentFilter = (props) => (
  <Filter {...props}>
    <TextInput label="Поиск по фамилии" source="last_name@ilike" alwaysOn />
    <ReferenceInput label="Группа" source="group_id" reference="groups">
      <SelectInput optionText="name" label="Группа" />
    </ReferenceInput>
    <SelectInput label="Статус" source="status" choices={[
      { id: 'Активен', name: 'Активен' },
      { id: 'Академ', name: 'Академ' },
      { id: 'Отчислен', name: 'Отчислен' },
    ]} />
  </Filter>
);

const GroupFilter = (props) => (
  <Filter {...props}>
    <TextInput label="Название группы" source="name@ilike" alwaysOn />
    <NumberInput label="Курс" source="course" />
  </Filter>
);

const SpecialtyFilter = (props) => (
  <Filter {...props}>
    <TextInput label="Название или код" source="name@ilike" alwaysOn />
  </Filter>
);

const TeacherFilter = (props) => (
  <Filter {...props}>
    <TextInput label="Фамилия преподавателя" source="last_name@ilike" alwaysOn />
  </Filter>
);

const SubjectFilter = (props) => (
  <Filter {...props}>
    <TextInput label="Название предмета" source="name@ilike" alwaysOn />
  </Filter>
);

const GradeFilter = (props) => (
  <Filter {...props}>
    <ReferenceInput source="subject_id" reference="subjects" alwaysOn>
      <SelectInput optionText="name" label="Предмет" />
    </ReferenceInput>
    <ReferenceInput source="student_id" reference="students">
      <SelectInput optionText="last_name" label="Студент" />
    </ReferenceInput>
    <SelectInput label="Тип контроля" source="work_type" choices={[
      { id: 'Текущая', name: 'Текущая' },
      { id: 'Экзамен', name: 'Экзамен' },
      { id: 'Зачёт', name: 'Зачёт' },
      { id: 'Курсовая', name: 'Курсовая' },
    ]} />
  </Filter>
);

const AttendanceFilter = (props) => (
  <Filter {...props}>
    <DateInput label="Дата" source="date" alwaysOn />
    <SelectInput
      label="Статус"
      source="status"
      choices={[
        { id: 'Был', name: 'Был' },
        { id: 'Опоздал', name: 'Опоздал' },
        { id: 'Болел', name: 'Болел' },
        { id: 'Прогулял', name: 'Прогулял' },
      ]}
    />
  </Filter>
);

//СТУДЕНТЫ 
export const StudentList = (props) => (
  <List {...props} filters={<StudentFilter />} title="Список студентов" sort={{ field: 'last_name', order: 'ASC' }}>
    <Datagrid rowClick="edit">
      <TextField source="id" label="ID" />
      <TextField source="last_name" label="Фамилия" />
      <TextField source="first_name" label="Имя" />
      <TextField source="middle_name" label="Отчество" />
      <DateField source="birth_date" label="Дата рождения" />
      <TextField source="phone" label="Телефон" />
      <TextField source="status" label="Статус" />
      <ReferenceField source="group_id" reference="groups" label="Группа">
        <TextField source="name" />
      </ReferenceField>
      <EditButton />
    </Datagrid>
  </List>
);

export const StudentEdit = (props) => (
  <Edit {...props} title="Редактирование студента">
    <SimpleForm>
      <TextInput source="last_name" label="Фамилия" validate={required()} />
      <TextInput source="first_name" label="Имя" validate={required()} />
      <TextInput source="middle_name" label="Отчество" />
      <DateInput source="birth_date" label="Дата рождения" />
      <TextInput source="phone" label="Телефон" />
      <SelectInput source="status" label="Статус" choices={[
        { id: 'Активен', name: 'Активен' },
        { id: 'Академ', name: 'Академ' },
        { id: 'Отчислен', name: 'Отчислен' },
      ]} />
      <ReferenceInput source="group_id" reference="groups" label="Группа">
        <SelectInput optionText="name" />
      </ReferenceInput>
    </SimpleForm>
  </Edit>
);

export const StudentCreate = (props) => (
  <Create {...props} title="Добавить студента">
    <SimpleForm>
      <TextInput source="last_name" label="Фамилия" validate={required()} />
      <TextInput source="first_name" label="Имя" validate={required()} />
      <TextInput source="middle_name" label="Отчество" />
      <DateInput source="birth_date" label="Дата рождения" />
      <TextInput source="phone" label="Телефон" />
      <SelectInput source="status" label="Статус" defaultValue="Активен" choices={[
        { id: 'Активен', name: 'Активен' },
        { id: 'Академ', name: 'Академ' },
        { id: 'Отчислен', name: 'Отчислен' },
      ]} />
      <ReferenceInput source="group_id" reference="groups" label="Группа">
        <SelectInput optionText="name" />
      </ReferenceInput>
    </SimpleForm>
  </Create>
);

//ГРУППЫ
export const GroupList = (props) => (
  <List {...props} filters={<GroupFilter />} title="Группы" sort={{ field: 'name', order: 'ASC' }}>
    <Datagrid rowClick="edit">
      <TextField source="id" label="ID" />
      <TextField source="name" label="Название" />
      <NumberField source="course" label="Курс" />
      <ReferenceField source="specialty_id" reference="specialties" label="Специальность">
        <TextField source="name" />
      </ReferenceField>
      <EditButton />
    </Datagrid>
  </List>
);

export const GroupEdit = (props) => (
  <Edit {...props} title="Редактирование группы">
    <SimpleForm>
      <TextInput source="name" label="Название группы" validate={required()} />
      <NumberInput source="course" label="Курс" validate={required()} />
      <ReferenceInput source="specialty_id" reference="specialties" label="Специальность">
        <SelectInput optionText="name" />
      </ReferenceInput>
    </SimpleForm>
  </Edit>
);

export const GroupCreate = (props) => (
  <Create {...props} title="Создать группу">
    <SimpleForm>
      <TextInput source="name" label="Название группы" validate={required()} />
      <NumberInput source="course" label="Курс" defaultValue={1} validate={required()} />
      <ReferenceInput source="specialty_id" reference="specialties" label="Специальность">
        <SelectInput optionText="name" />
      </ReferenceInput>
    </SimpleForm>
  </Create>
);

//СПЕЦИАЛЬНОСТИ
export const SpecialtyList = (props) => (
  <List {...props} filters={<SpecialtyFilter />} title="Специальности">
    <Datagrid rowClick="edit">
      <TextField source="id" label="ID" />
      <TextField source="code" label="Код" />
      <TextField source="name" label="Наименование" />
      <EditButton />
    </Datagrid>
  </List>
);

export const SpecialtyEdit = (props) => (
  <Edit {...props} title="Редактирование специальности">
    <SimpleForm>
      <TextInput source="code" label="Код специальности" validate={required()} />
      <TextInput source="name" label="Наименование" validate={required()} />
    </SimpleForm>
  </Edit>
);

export const SpecialtyCreate = (props) => (
  <Create {...props} title="Добавить специальность">
    <SimpleForm>
      <TextInput source="code" label="Код специальности" validate={required()} />
      <TextInput source="name" label="Наименование" validate={required()} />
    </SimpleForm>
  </Create>
);

//ПРЕПОДАВАТЕЛИ 
export const TeacherList = (props) => (
  <List {...props} filters={<TeacherFilter />} title="Преподаватели" sort={{ field: 'last_name', order: 'ASC' }}>
    <Datagrid rowClick="edit">
      <TextField source="id" label="ID" />
      <TextField source="last_name" label="Фамилия" />
      <TextField source="first_name" label="Имя" />
      <TextField source="middle_name" label="Отчество" />
      <EditButton />
    </Datagrid>
  </List>
);

export const TeacherEdit = (props) => (
  <Edit {...props} title="Редактирование преподавателя">
    <SimpleForm>
      <TextInput source="last_name" label="Фамилия" validate={required()} />
      <TextInput source="first_name" label="Имя" validate={required()} />
      <TextInput source="middle_name" label="Отчество" />
    </SimpleForm>
  </Edit>
);

export const TeacherCreate = (props) => (
  <Create {...props} title="Добавить преподавателя">
    <SimpleForm>
      <TextInput source="last_name" label="Фамилия" validate={required()} />
      <TextInput source="first_name" label="Имя" validate={required()} />
      <TextInput source="middle_name" label="Отчество" />
    </SimpleForm>
  </Create>
);

//ДИСЦИПЛИНЫ 
export const SubjectList = (props) => (
  <List {...props} filters={<SubjectFilter />} title="Дисциплины" sort={{ field: 'name', order: 'ASC' }}>
    <Datagrid rowClick="edit">
      <TextField source="id" label="ID" />
      <TextField source="name" label="Название предмета" />
      <EditButton />
    </Datagrid>
  </List>
);

export const SubjectEdit = (props) => (
  <Edit {...props} title="Редактирование предмета">
    <SimpleForm>
      <TextInput source="name" label="Название предмета" validate={required()} />
    </SimpleForm>
  </Edit>
);

export const SubjectCreate = (props) => (
  <Create {...props} title="Добавить предмет">
    <SimpleForm>
      <TextInput source="name" label="Название предмета" validate={required()} />
    </SimpleForm>
  </Create>
);

//ОЦЕНКИ
export const GradeList = (props) => (
  <List {...props} filters={<GradeFilter />} title="Успеваемость / Оценки" sort={{ field: 'date', order: 'DESC' }}>
    <Datagrid rowClick="edit">
      <TextField source="id" label="ID" />
      <ReferenceField source="student_id" reference="students" label="Студент">
        <TextField source="last_name" />
      </ReferenceField>
      <ReferenceField source="subject_id" reference="subjects" label="Предмет">
        <TextField source="name" />
      </ReferenceField>
      <TextField source="work_type" label="Тип контроля" />
      <NumberField source="score" label="Балл" />
      <DateField source="date" label="Дата" />
      <ReferenceField source="teacher_id" reference="teachers" label="Преподаватель">
        <TextField source="last_name" />
      </ReferenceField>
      <EditButton />
    </Datagrid>
  </List>
);

export const GradeEdit = (props) => (
  <Edit {...props} title="Изменить оценку">
    <SimpleForm>
      <ReferenceInput source="student_id" reference="students" label="Студент"><SelectInput optionText="last_name" /></ReferenceInput>
      <ReferenceInput source="subject_id" reference="subjects" label="Предмет"><SelectInput optionText="name" /></ReferenceInput>
      <ReferenceInput source="teacher_id" reference="teachers" label="Преподаватель"><SelectInput optionText="last_name" /></ReferenceInput>
      <SelectInput source="work_type" label="Тип контроля" choices={[
        { id: 'Текущая', name: 'Текущая' }, { id: 'Экзамен', name: 'Экзамен' }, { id: 'Зачёт', name: 'Зачёт' }, { id: 'Курсовая', name: 'Курсовая' }
      ]} />
      <NumberInput source="score" label="Оценка (2-5)" validate={required()} />
      <DateInput source="date" label="Дата" />
    </SimpleForm>
  </Edit>
);

export const GradeCreate = (props) => (
  <Create {...props} title="Выставить оценку">
    <SimpleForm>
      <ReferenceInput source="student_id" reference="students" label="Студент"><SelectInput optionText="last_name" /></ReferenceInput>
      <ReferenceInput source="subject_id" reference="subjects" label="Предмет"><SelectInput optionText="name" /></ReferenceInput>
      <ReferenceInput source="teacher_id" reference="teachers" label="Преподаватель"><SelectInput optionText="last_name" /></ReferenceInput>
      <SelectInput source="work_type" label="Тип контроля" defaultValue="Текущая" choices={[
        { id: 'Текущая', name: 'Текущая' }, { id: 'Экзамен', name: 'Экзамен' }, { id: 'Зачёт', name: 'Зачёт' }, { id: 'Курсовая', name: 'Курсовая' }
      ]} />
      <NumberInput source="score" label="Оценка (2-5)" validate={required()} />
      <DateInput source="date" label="Дата" defaultValue={new Date()} />
    </SimpleForm>
  </Create>
);

// ПОСЕЩАЕМОСТЬ
export const AttendanceList = (props) => (
  <List 
    {...props} 
    filters={<AttendanceFilter />} 
    title="Посещаемость" 
    sort={{ field: 'date', order: 'DESC' }}
  >
    <Datagrid rowClick="edit">
      <TextField source="id" label="ID" />
      <ReferenceField source="student_id" reference="students" label="Студент">
        <TextField source="last_name" />
      </ReferenceField>
      <ReferenceField source="subject_id" reference="subjects" label="Предмет">
        <TextField source="name" />
      </ReferenceField>
      <DateField source="date" label="Дата" />
      <TextField source="status" label="Статус" />
      <EditButton />
    </Datagrid>
  </List>
);

export const AttendanceEdit = (props) => (
  <Edit {...props} title="Изменить статус посещаемости">
    <SimpleForm>
      <ReferenceInput source="student_id" reference="students" label="Студент"><SelectInput optionText="last_name" /></ReferenceInput>
      <ReferenceInput source="subject_id" reference="subjects" label="Предмет"><SelectInput optionText="name" /></ReferenceInput>
      <DateInput source="date" label="Дата" />
      <SelectInput source="status" label="Статус" choices={[
        { id: 'Был', name: 'Был' }, { id: 'Опоздал', name: 'Опоздал' }, { id: 'Болел', name: 'Болел' }, { id: 'Прогулял', name: 'Прогулял' }
      ]} />
    </SimpleForm>
  </Edit>
);

export const AttendanceCreate = (props) => (
  <Create {...props} title="Отметить посещаемость">
    <SimpleForm>
      <ReferenceInput source="student_id" reference="students" label="Студент"><SelectInput optionText="last_name" /></ReferenceInput>
      <ReferenceInput source="subject_id" reference="subjects" label="Предмет"><SelectInput optionText="name" /></ReferenceInput>
      <DateInput source="date" label="Дата" defaultValue={new Date()} />
      <SelectInput source="status" label="Статус" defaultValue="Был" choices={[
        { id: 'Был', name: 'Был' }, { id: 'Опоздал', name: 'Опоздал' }, { id: 'Болел', name: 'Болел' }, { id: 'Прогулял', name: 'Прогулял' }
      ]} />
    </SimpleForm>
  </Create>
);


const App = () => (
  <Admin 
    dataProvider={dataProvider} 
    authProvider={authProvider}
    i18nProvider={i18nProvider}
    loginPage={MyLoginPage}
    layout={MyLayout}
    
  >
    <Resource name="students" list={StudentList} edit={StudentEdit} create={StudentCreate} icon={PersonIcon} options={{ label: 'Студенты' }} />
    <Resource name="groups" list={GroupList} edit={GroupEdit} create={GroupCreate} icon={GroupIcon} options={{ label: 'Группы' }} />
    <Resource name="specialties" list={SpecialtyList} edit={SpecialtyEdit} create={SpecialtyCreate} icon={SchoolIcon} options={{ label: 'Специальности' }} />
    <Resource name="teachers" list={TeacherList} edit={TeacherEdit} create={TeacherCreate} icon={ClassIcon} options={{ label: 'Преподаватели' }} />
    <Resource name="subjects" list={SubjectList} edit={SubjectEdit} create={SubjectCreate} icon={SchoolIcon} options={{ label: 'Дисциплины' }} />
    <Resource name="grades" list={GradeList} edit={GradeEdit} create={GradeCreate} icon={GradeIcon} options={{ label: 'Оценки' }} />
    <Resource name="attendance" list={AttendanceList} edit={AttendanceEdit} create={AttendanceCreate} icon={CheckCircleIcon} options={{ label: 'Посещаемость' }} />
  </Admin>
);

export default App;