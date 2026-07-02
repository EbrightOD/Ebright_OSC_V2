import { createContext, useReducer } from 'react';

export const OnboardingContext = createContext(null);

const initialState = {
  formData: {
    role: null,
    branch: null,
    department: null,
    fullName: '', email: '', phone: '',
    ic: '', dob: null, gender: '', address: '',
    bank: '', accountNumber: '',
    emergencyName: '', emergencyPhone: '', emergencyRelationship: '',
    university: '', qualification: '', fieldOfStudy: '',
    startDate: null,
    reportingManager: '',
  },
  completedPages: {
    welcome: false,
    details: false,
    ceoStory: false,
    team: false,
    orgChart: false,
    village: false,
    branchTraining: false,
  },
  villageProgress: {
    selectedAvatar: null,
    completedLevels: [],
    xpTotal: 0,
  },
  branchTasks: { day2: {}, day3: {} },
  submissionStatus: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_FORM_DATA':
      return { ...state, formData: { ...state.formData, ...action.payload } };
    case 'MARK_PAGE_COMPLETE':
      return { ...state, completedPages: { ...state.completedPages, [action.payload]: true } };
    case 'UPDATE_VILLAGE_PROGRESS':
      return { ...state, villageProgress: { ...state.villageProgress, ...action.payload } };
    case 'COMPLETE_LEVEL': {
      const { levelId, xp } = action.payload;
      const completed = state.villageProgress.completedLevels.includes(levelId)
        ? state.villageProgress.completedLevels
        : [...state.villageProgress.completedLevels, levelId];
      return {
        ...state,
        villageProgress: {
          ...state.villageProgress,
          completedLevels: completed,
          xpTotal: state.villageProgress.xpTotal + (xp || 0),
        },
      };
    }
    case 'UPDATE_BRANCH_TASKS':
      return { ...state, branchTasks: { ...state.branchTasks, ...action.payload } };
    case 'SET_SUBMISSION_STATUS':
      return { ...state, submissionStatus: action.payload };
    default:
      return state;
  }
}

export function OnboardingProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <OnboardingContext.Provider value={{ state, dispatch }}>
      {children}
    </OnboardingContext.Provider>
  );
}
