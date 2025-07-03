import React from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Divider
} from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EmailIcon from '@mui/icons-material/Email';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DevicesIcon from '@mui/icons-material/Devices';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import PrintIcon from '@mui/icons-material/Print';

/**
 * Help component for PDF sharing functionality
 * This component can be integrated into the application to provide in-app help
 * for users on how to access and use the PDF sharing feature.
 */
const PdfSharingHelp = ({ open, onClose }) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
        <ShareIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Как да споделите PDF версия на офертата
      </DialogTitle>
      
      <DialogContent sx={{ py: 3 }}>
        <Typography variant="h6" gutterBottom>
          Стъпка 1: Отворете страницата "Преглед пакет"
        </Typography>
        <Typography paragraph>
          След като изберете застрахователен пакет, ще бъдете насочени към страницата "Преглед пакет", 
          където можете да видите детайлите на избраната оферта.
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="h6" gutterBottom>
          Стъпка 2: Използвайте бутона "Сподели"
        </Typography>
        <Typography paragraph>
          В горния десен ъгъл на страницата ще видите бутон "Сподели" със съответната икона. 
          Имате няколко начина да споделите офертата:
        </Typography>
        
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, fontWeight: 'bold' }}>
          <DevicesIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Опция 1: Директно споделяне (на поддържани устройства)
        </Typography>
        <Typography paragraph>
          На мобилни устройства и модерни браузъри, които поддържат Web Share API, натискането на бутона "Сподели" 
          ще отвори нативния диалог за споделяне на вашето устройство. Оттам можете да:
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon><EmailIcon /></ListItemIcon>
            <ListItemText primary="Споделите PDF връзката чрез имейл" />
          </ListItem>
          <ListItem>
            <ListItemIcon><ShareIcon /></ListItemIcon>
            <ListItemText primary="Споделите чрез социални мрежи" />
          </ListItem>
          <ListItem>
            <ListItemIcon><ShareIcon /></ListItemIcon>
            <ListItemText primary="Споделите чрез приложения за съобщения" />
          </ListItem>
          <ListItem>
            <ListItemIcon><SaveAltIcon /></ListItemIcon>
            <ListItemText primary="Запазите връзката" />
          </ListItem>
        </List>
        
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, fontWeight: 'bold' }}>
          <ShareIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Опция 2: Използване на менюто за споделяне
        </Typography>
        <Typography paragraph>
          Ако натиснете бутона "Сподели", ще се отвори меню със следните опции:
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon><ContentCopyIcon /></ListItemIcon>
            <ListItemText 
              primary="Копирай информация" 
              secondary="Копира основната информация за офертата в клипборда" 
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><EmailIcon /></ListItemIcon>
            <ListItemText 
              primary="Сподели по имейл" 
              secondary="Отваря имейл клиента с предварително попълнена тема и съдържание" 
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><PictureAsPdfIcon /></ListItemIcon>
            <ListItemText 
              primary="Виж като PDF" 
              secondary="Отваря PDF версия на офертата в нов раздел на браузъра" 
            />
          </ListItem>
        </List>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="h6" gutterBottom>
          <PictureAsPdfIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Как да прегледате PDF версията на офертата
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon>1</ListItemIcon>
            <ListItemText primary="Натиснете бутона 'Сподели'" />
          </ListItem>
          <ListItem>
            <ListItemIcon>2</ListItemIcon>
            <ListItemText primary="Изберете опцията 'Виж като PDF' от менюто" />
          </ListItem>
          <ListItem>
            <ListItemIcon>3</ListItemIcon>
            <ListItemText primary="PDF документът ще се отвори в нов раздел на браузъра" />
          </ListItem>
        </List>
        
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          <SaveAltIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Как да запазите PDF версията на офертата
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon>1</ListItemIcon>
            <ListItemText primary="Използвайте функцията за печат на браузъра (Ctrl+P или Cmd+P)" />
          </ListItem>
          <ListItem>
            <ListItemIcon>2</ListItemIcon>
            <ListItemText primary="Изберете опцията 'Запази като PDF' или използвайте бутона за запазване в браузъра" />
          </ListItem>
          <ListItem>
            <ListItemIcon>3</ListItemIcon>
            <ListItemText primary="Изберете местоположение на вашето устройство и запазете файла" />
          </ListItem>
        </List>
        
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          <PrintIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Как да отпечатате PDF версията на офертата
        </Typography>
        <List dense>
          <ListItem>
            <ListItemIcon>1</ListItemIcon>
            <ListItemText primary="Отворете PDF документа чрез опцията 'Виж като PDF'" />
          </ListItem>
          <ListItem>
            <ListItemIcon>2</ListItemIcon>
            <ListItemText primary="Използвайте функцията за печат на браузъра (Ctrl+P или Cmd+P)" />
          </ListItem>
          <ListItem>
            <ListItemIcon>3</ListItemIcon>
            <ListItemText primary="Изберете вашия принтер и настройки за печат" />
          </ListItem>
          <ListItem>
            <ListItemIcon>4</ListItemIcon>
            <ListItemText primary="Натиснете бутона 'Печат'" />
          </ListItem>
        </List>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} variant="contained" color="primary">
          Разбрах
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PdfSharingHelp;