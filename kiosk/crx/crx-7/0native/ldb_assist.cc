#include "stdio.h"
#include "sha256.h"
#include "md5.h"
#include <string>

#include "ppapi/cpp/instance.h"
#include "ppapi/cpp/module.h"
#include "ppapi/cpp/var.h"




namespace {


  const char* const kSecret1 = "90a4dde52cd05a1503b1385773913fa4";
  const char* const kSecret2 = "2abca49704aecef3f4922b3a9ec931f0";
  const char* const kBbX      ="Q9c48ntZrPs";


} // namespace

class LdbAssistInstance : public pp::Instance {
 public:

  explicit LdbAssistInstance(PP_Instance instance) : pp::Instance(instance)  {
    //fprintf(stdout, "Sending message to HandleMessage %s\n",kReplyString);
  }
  virtual ~LdbAssistInstance() {}

  virtual void HandleMessage(const pp::Var& var_message) {    
    if (!var_message.is_string())
    return;

    std::string message = var_message.AsString();

    pp::Var var_reply;

    //fprintf(stdout, "Sending message to HandleMessage %s\n",kReplyString);

    // get the time
    PP_Time sessionTime = pp::Module::Get()->core()->GetTime() * 100000;
    std::string time_str = std::to_string( (long long) sessionTime );

    //time_str = "1234567890";

    std::string shatime = sha256( time_str );
    

    std::size_t found = message.find("sessionKey::");

    
    if (found != std::string::npos) {
      std::size_t foundcolon = message.find("::");
      std::string instanceid = message.substr (foundcolon+2);

      //instanceid = "asdfg";

      // SHA256( SHA256( t ) + secret1 + SHA256( k )  )
      
      std::string shaid = sha256( instanceid );
      std::string finalsha = sha256( shatime + kSecret1 + shaid );

      std::string out = "sessionKey::k="+instanceid+"&t="+time_str+"&s="+finalsha;


      var_reply = pp::Var(out);
      PostMessage(var_reply);
    } else {
      std::size_t found2 = message.find("setup::");

      if (found2 != std::string::npos) {
        // setup message
        std::size_t foundcolon = message.find("::");
        std::string  instanceidsession = message.substr (foundcolon+2);
        foundcolon = instanceidsession.find("::");

        std::string instanceid = instanceidsession.substr(0, foundcolon);

        //instanceid = "asdfg";

        std::string sessionid = instanceidsession.substr (foundcolon+2);

        //SHA256( secret2 + SHA256( k ) + SHA256( t ) + sessionToken )
        std::string shaid = sha256( instanceid );        
        
        std::string finalsha = sha256( kSecret2 + shaid + shatime + sessionid );

        std::string out = "setup::k="+instanceid+"&t="+time_str+"&y=BLACKBOARD,SCHOOLOGY,CANVAS&s="+finalsha;

        PostMessage(out);


      } else {
        std::size_t found3 = message.find("urlget::");

        if (found3 != std::string::npos) {

            // setup message
          std::size_t foundcolon = message.find("::");
          std::string  instanceidprofile = message.substr (foundcolon+2);
          foundcolon = instanceidprofile.find("::");

          std::string instanceid = instanceidprofile.substr(0, foundcolon);
          std::string profileidsession = instanceidprofile.substr (foundcolon+2);

          foundcolon = profileidsession.find("::");
          std::string sessionid = profileidsession.substr(0, foundcolon);
          std::string profileid = profileidsession.substr (foundcolon+2);

          // SHA256( secret2 + SHA256( p ) + SHA256( k ) + SHA256( t ) + sessionToken )

          std::string shaid = sha256( instanceid );  
          std::string shaprofile = sha256( profileid );  

          std::string finalsha = sha256( kSecret2 + shaprofile + shaid + shatime + sessionid );          

          std::string out = "urlget::k="+instanceid+"&t="+time_str+"&p=" + profileid + "&s="+finalsha;          

          PostMessage(out);

        } else {

          //LdbAssist.postMessage('pass::' + m_instanceID + "::" + profileid + "::" + courseid + "::" + examid);
          std::size_t found4 = message.find("pass::");

        if (found4 != std::string::npos) {

            // setup message
          std::size_t foundcolon = message.find("::");
          std::string  instanceidprofile = message.substr (foundcolon+2);
          
          foundcolon = instanceidprofile.find("::");
          std::string instanceid = instanceidprofile.substr(0, foundcolon);
          std::string profileidcourse = instanceidprofile.substr (foundcolon+2);

          foundcolon = profileidcourse.find("::");
          std::string profileid = profileidcourse.substr(0, foundcolon);
          std::string courseexam = profileidcourse.substr (foundcolon+2);

          foundcolon = courseexam.find("::");
          std::string courseid = courseexam.substr(0, foundcolon);
          std::string examidsession = courseexam.substr (foundcolon+2);

          foundcolon = examidsession.find("::");
          std::string examid = examidsession.substr(0, foundcolon);
          std::string session_id = examidsession.substr (foundcolon+2);

          // SHA256( secret2 + SHA256( p ) + SHA256( k ) + SHA256(c) + SHA256(  t  ) + SHA256( e ) + sessionToken )

          


          std::string shaid = sha256( instanceid );  
          std::string shaprofile = sha256( profileid );  
          std::string shacourse = sha256( courseid );  
          std::string shaexam = sha256( examid ); 


          std::string finalsha = sha256( kSecret2 + shaprofile + shaid + shacourse + shatime + shaexam + session_id );

          std::string out = "pass::k="+instanceid+"&t="+time_str+"&p=" + profileid + "&c=" + courseid + "&e=" + examid + "&s=" + finalsha;          

          //SHA256( secret2 + SHA256( p ) + SHA256( k ) + SHA256( t ) + sessionToken )
          std::string usersha = sha256( kSecret2 + shaprofile + shaid + shatime + session_id );
          std::string out2 = "k="+instanceid+"&t="+time_str+"&p=" + profileid + "&s=" + usersha;

          out = out + "::" + out2;

          PostMessage(out);

        } else {
      
          std::size_t found5 = message.find("review::");

          if (found5 != std::string::npos) {

            std::size_t foundcolon = message.find("::");
            std::string  attemptcourse = message.substr (foundcolon+2);
            
            foundcolon = attemptcourse.find("::");
            std::string attemptid = attemptcourse.substr(0, foundcolon);
            std::string courseid = attemptcourse.substr(foundcolon+2);

            std::string instring = "attempt_id=" + attemptid + "&course_id=" + courseid + '&' + kBbX;

            std::string out = "review::" + md5(instring);

            PostMessage(out);

          } else {

            std::size_t found6 = message.find("alurl::");

            if (found6 != std::string::npos) {

              std::size_t foundcolon = message.find("::");
              std::string instanceidsession = message.substr (foundcolon+2);

              std::size_t foundcolon2 = instanceidsession.find("::");
              std::string instanceid = instanceidsession.substr(0, foundcolon2);
              std::string sessionid = instanceidsession.substr(foundcolon2+2);
              
              // SHA256( secret2 + SHA256( p ) + SHA256( k ) + SHA256( t ) + sessionToken )

              std::string shaid = sha256( instanceid );  
              std::string shaindex = sha256( "gh" );  

              std::string finalsha = sha256( kSecret2 + shaindex + shaid + shatime + sessionid );          

              std::string out = "alurl::k="+instanceid+"&t="+time_str+"&i=gh" + "&s="+finalsha;       

              

              PostMessage(out);


          }  else {

          std::size_t found6 = message.find("alurlcan::");

            if (found6 != std::string::npos) {

              std::size_t foundcolon = message.find("::");
              std::string instanceidsession = message.substr (foundcolon+2);

              std::size_t foundcolon2 = instanceidsession.find("::");
              std::string instanceid = instanceidsession.substr(0, foundcolon2);
              std::string sessionid = instanceidsession.substr(foundcolon2+2);
              
              // SHA256( secret2 + SHA256( p ) + SHA256( k ) + SHA256( t ) + sessionToken )

              std::string shaid = sha256( instanceid );  
              std::string shaindex = sha256( "bk" );  

              std::string finalsha = sha256( kSecret2 + shaindex + shaid + shatime + sessionid );          

              std::string out = "alurlcan::k="+instanceid+"&t="+time_str+"&i=bk" + "&s="+finalsha;       

              

              PostMessage(out);


          }  else {

          PostMessage("ERROR");
        }
        }
      }
          

        
      }
    }
  }
}
    

    //if (message == kHelloString) {
    //  var_reply = pp::Var(sessionTime);
    //  PostMessage(var_reply);
    //}


  }
};

class LdbAssistModule : public pp::Module {
 public:
  LdbAssistModule() : pp::Module() {}
  virtual ~LdbAssistModule() {}

  virtual pp::Instance* CreateInstance(PP_Instance instance) {
    return new LdbAssistInstance(instance);
  }
};

namespace pp {

  Module* CreateModule() {
    return new LdbAssistModule();
  }

}  // namespace pp
